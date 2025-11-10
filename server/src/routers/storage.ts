import crypto from "node:crypto";
import {
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { BUCKET_NAME, s3 } from "../lib/bucket.js";
import { prisma } from "../lib/prisma.js";

const UploadBody = z.object({
	contentType: z.string().min(1),
	key: z.string().min(1).optional(),
});

const CompleteBody = z.object({
	key: z.string().min(1),
	mime: z.string().min(1),
	bytes: z.coerce.number().int().min(1),
	sha256: z.string().min(1).optional(), // 任意（重複検知などに利用）
	exifHint: z.record(z.string(), z.string()).optional(), // 任意（撮影日時などヒント）
});

const DownloadQuery = z.object({ key: z.string().min(1) });

const ListQuery = z.object({
	prefix: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(1000).optional(),
	token: z.string().optional(),
	presign: z.coerce.boolean().optional(), // 例: ?presign=1
	ttl: z.coerce.number().int().min(60).max(3600).optional(), // 例: ?ttl=300
	onlyImages: z.coerce.boolean().optional(), // 例: ?onlyImages=0 で全て署名
});

const extFrom = (ct: string) =>
	({
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/webp": "webp",
		"image/heic": "heic",
		"image/heif": "heif",
	})[ct] ?? "bin";

const makeKey = (ext: string) =>
	`photos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

// 画像判定（拡張子ベース）
const isImageKey = (key: string) =>
	/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(key);

// 簡易: 同時実行を制御
async function mapWithLimit<T, R>(
	arr: T[],
	limit: number,
	fn: (v: T, i: number) => Promise<R>,
): Promise<R[]> {
	const ret: R[] = new Array(arr.length);
	let i = 0;
	const workers = new Array(Math.min(limit, arr.length))
		.fill(0)
		.map(async () => {
			while (i < arr.length) {
				const cur = i++;
				ret[cur] = await fn(arr[cur], cur);
			}
		});
	await Promise.all(workers);
	return ret;
}

// 追加: S3上の存在確認（HEAD）ヘルパ
async function ensureObjectExists(key: string) {
	await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}

// 追加: AIワーカーへの投入ダミー（実装はお好みのキューで差し替えてOK）
async function enqueueAIJob(input: {
	photoId: string;
	key: string;
	mime: string;
	bytes: number;
	sha256?: string;
}) {
	// TODO: BullMQ / RabbitMQ / Cloud Tasks / 自前ワーカーへ投げる
	// いまはログだけ（MVP）
	console.log("[AI-QUEUE] enqueue", input);
}

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

		// 1) S3 に実体確認
		try {
			await ensureObjectExists(key);
		} catch {
			return c.json(
				{ error: "ObjectNotFound", message: `No such object: ${key}` },
				400,
			);
		}

		// 2) DB 作成（同一キーの重複を避けたいなら upsert にしてもOK）
		const createdAt =
			typeof exifHint?.taken_at === "string"
				? new Date(exifHint.taken_at)
				: new Date();

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
				createdAt, // 並び順に効くのでここで確定
			},
		});

		// 3) 必要なら解析キューへ
		await enqueueAIJob({ photoId: rec.id, key, mime, bytes, sha256 });

		// 4) 返却用に完全アイテムを整形
		//    counts と本人の isFavorited を同時に取得
		const full = await prisma.photo.findUniqueOrThrow({
			where: { id: rec.id },
			include: {
				_count: { select: { PhotoComment: true, PhotoFavorite: true } },
				PhotoFavorite: { where: { userId }, select: { userId: true } },
			},
		});

		// 署名付きプレビュー（任意: クエリで presign/ttl を切替可能にしても◎）
		let previewUrl: string | null = null;
		if (isImageKey(full.objectKey)) {
			previewUrl = await getSignedUrl(
				s3,
				new GetObjectCommand({ Bucket: BUCKET_NAME, Key: full.objectKey }),
				{ expiresIn: 300 },
			);
		}

		// 5) 完全な PhotoItem を返す
		return c.json({
			item: {
				id: full.id,
				objectKey: full.objectKey,
				mime: full.mime,
				bytes: full.bytes,
				createdAt: full.createdAt,
				width: full.width,
				height: full.height,
				exifJson: full.exifJson,
				status: full.status,
				previewUrl,
				favoriteCount: full._count.PhotoFavorite,
				commentCount: full._count.PhotoComment,
				isFavorited: full.PhotoFavorite.length > 0,
			},
		});
	});
