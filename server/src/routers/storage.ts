import crypto from "node:crypto";
import {
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { BUCKET_NAME, s3 } from "../lib/bucket.js";
import { prisma } from "../lib/prisma.js";
import { CompleteBody, DownloadQuery, ListQuery, UploadBody } from "@refeel/shared/storage.js";
import { extFrom, makeKey, isImageKey, mapWithLimit, ensureObjectExists, enqueueAIJob } from "@/lib/utils.js";


export const storage = new Hono()
	// 一覧 + オプションでプレビューURLを同梱
	.get("/", zValidator("query", ListQuery), async (c) => {
		const { prefix, limit, token, presign, ttl, onlyImages } =
			c.req.valid("query");

		const out = await s3.send(
			new ListObjectsV2Command({
				Bucket: BUCKET_NAME,
				Prefix: prefix,
				MaxKeys: limit ?? 100,
				ContinuationToken: token,
				// フォルダ風にしたい場合は Delimiter: "/" を追加
			}),
		);

		const baseItems = (out.Contents ?? []).flatMap((obj) => {
			if (!obj.Key) return [];
			return [
				{
					key: obj.Key,
					size: obj.Size ?? 0,
					lastModified: obj.LastModified
						? obj.LastModified.toISOString()
						: null,
				},
			];
		});

		// 署名URLを付与するか
		const shouldPresign = !!presign;
		let items = baseItems;

		if (shouldPresign && baseItems.length > 0) {
			const expiresIn = ttl ?? 300;
			const imagesOnly = onlyImages !== false; // 既定: 画像のみ署名

			// 署名対象のキーを決める
			const targets = baseItems.map((it) => ({
				...it,
				needUrl: imagesOnly ? isImageKey(it.key) : true,
			}));

			// 同時実行 8 で presign（必要なものだけ）
			const withUrl = await mapWithLimit(targets, 8, async (it) => {
				if (!it.needUrl) return { ...it, previewUrl: null as string | null };
				const url = await getSignedUrl(
					s3,
					new GetObjectCommand({ Bucket: BUCKET_NAME, Key: it.key }),
					{ expiresIn },
				);
				return { ...it, previewUrl: url as string };
			});

			items = withUrl;
		} else {
			// URLを付けない場合は previewUrl を明示的に null にしておくとフロントで扱いやすい
			items = baseItems.map((it) => ({
				...it,
				previewUrl: null as string | null,
			}));
		}

		return c.json({
			items,
			nextToken: out.IsTruncated ? (out.NextContinuationToken ?? null) : null,
			prefix: prefix ?? null,
			limit: limit ?? 100,
		});
	})

	.post("/presign/upload", zValidator("json", UploadBody), async (c) => {
		const { contentType, key: rawKey } = c.req.valid("json");
		const key = rawKey ?? makeKey(extFrom(contentType));

		const expiresIn = 300;

		// アップロード用（PUT）
		const url = await getSignedUrl(
			s3,
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
				ContentType: contentType,
			}),
			{ expiresIn },
		);

		// プレビュー用（GET）
		const previewUrl = await getSignedUrl(
			s3,
			new GetObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
			}),
			{ expiresIn },
		);

		return c.json({ key, url, previewUrl, expiresIn });
	})

	.get("/presign/download", zValidator("query", DownloadQuery), async (c) => {
		const { key } = c.req.valid("query");
		const url = await getSignedUrl(
			s3,
			new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
			{ expiresIn: 300 },
		);
		return c.json({ key, url, expiresIn: 300 });
	})

	.post("/complete", zValidator("json", CompleteBody), async (c) => {
		const userId = c.var.userId as string;
		const { key, mime, bytes, sha256, exifHint } = c.req.valid("json");

		// 任意: /complete?presign=1&ttl=300 のように制御
		const url = new URL(c.req.url);
		const wantPresign = url.searchParams.get("presign") === "1";
		const ttlSec = Math.max(60, Math.min(3600, Number(url.searchParams.get("ttl") ?? "300"))); // 60〜3600の範囲

		// 1) S3 に実体確認（HeadObject的な軽量確認）
		try {
			await ensureObjectExists(key);
		} catch {
			return c.json(
				{ error: "ObjectNotFound", message: `No such object: ${key}` },
				400
			);
		}

		// 2) DB 作成（重複を避けたいなら upsert / unique 制約）
		const createdAt =
			typeof exifHint?.taken_at === "string"
				? new Date(exifHint.taken_at)
				: new Date();

		// 例: objectKey + userId でユニーク制約を想定
		// Prisma: @@unique([userId, objectKey])
		const rec = await prisma.photo.create({
			data: {
				id: crypto.randomUUID(),
				userId,
				objectKey: key,
				mime,
				bytes,
				sha256: sha256 ?? null,
				exifJson: exifHint ?? null,
				status: "UPLOADED",
				createdAt, // 並び順基準
			},
		});

		// 3) 必要なら解析キューへ
		await enqueueAIJob({ photoId: rec.id, key, mime, bytes, sha256 });

		// 4) counts と本人の isFavorited を同時に取得
		const full = await prisma.photo.findUniqueOrThrow({
			where: { id: rec.id },
			include: {
				_count: { select: { PhotoComment: true, PhotoFavorite: true } },
				PhotoFavorite: { where: { userId }, select: { userId: true } },
			},
		});

		// 5) 画像だけ署名URL（クエリ指定がある場合のみ）
		let previewUrl: string | null = null;
		if (wantPresign && isImageKey(full.objectKey)) {
			previewUrl = await getSignedUrl(
				s3,
				new GetObjectCommand({ Bucket: BUCKET_NAME, Key: full.objectKey }),
				{ expiresIn: ttlSec }
			);
		}

		// 6) 完全な PhotoItem を返す（createdAt は ISO に）
		return c.json(
			{
				item: {
					id: full.id,
					objectKey: full.objectKey,
					mime: full.mime,
					bytes: full.bytes,
					createdAt: full.createdAt.toISOString(), // ★ ISO文字列で返す
					width: full.width,
					height: full.height,
					exifJson: full.exifJson,
					status: full.status,
					previewUrl,
					favoriteCount: full._count.PhotoFavorite,
					commentCount: full._count.PhotoComment,
					isFavorited: full.PhotoFavorite.length > 0,
				},
			},
			201 // 作成
		);
	});
