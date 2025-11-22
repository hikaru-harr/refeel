// src/routes/photos.ts

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Hono } from "hono";
import { z } from "zod";
import { BUCKET_NAME, s3 } from "../lib/bucket.js";
import { prisma } from "../lib/prisma.js";

export const photos = new Hono();

// --- コメント ---
const createCommentSchema = z.object({
	body: z.string().trim().min(1).max(2000),
});

const ListQuery = z.object({
	take: z.coerce.number().int().min(1).max(200).optional(),
	cursor: z.uuid().optional(),
	group: z.enum(["ym", "ymd", "all"]).optional(),
	presign: z.coerce.boolean().optional(),
	ttl: z.coerce.number().int().min(60).max(3600).optional(),
});

photos.get("/:photoId/comments", async (c) => {
	const { photoId } = c.req.param();
	const items = await prisma.photoComment.findMany({
		where: { photoId },
		orderBy: { createdAt: "asc" },
		take: 100, // 必要なら cursor でページング
	});
	return c.json({ items });
});

photos.post("/:photoId/comments", async (c) => {
	const userId = c.var.userId as string;
	const { photoId } = c.req.param();
	const input = createCommentSchema.parse(await c.req.json());

	const created = await prisma.photoComment.create({
		data: { photoId, userId, body: input.body },
	});
	return c.json({ item: created });
});

photos.delete("/:photoId/comments/:commentId", async (c) => {
	const userId = c.var.userId as string;
	const { photoId, commentId } = c.req.param();

	// 自分のコメントだけ削除（管理者権限があるなら条件拡張）
	const target = await prisma.photoComment.findUnique({
		where: { id: commentId },
	});
	if (!target || target.photoId !== photoId || target.userId !== userId) {
		return c.body(null, 403);
	}
	await prisma.photoComment.delete({ where: { id: commentId } });
	return c.json({ ok: true });
});

// --- お気に入り ---
photos.post("/:photoId/favorite", async (c) => {
	const userId = c.var.userId as string;
	const { photoId } = c.req.param();
	await prisma.photoFavorite.upsert({
		where: { photoId_userId: { userId, photoId } },
		create: { userId, photoId },
		update: {},
	});
	return c.json({ ok: true });
});

photos.delete("/:photoId/favorite", async (c) => {
	const userId = c.var.userId as string;
	const { photoId } = c.req.param();
	await prisma.photoFavorite
		.delete({
			where: { photoId_userId: { userId, photoId } },
		})
		.catch(() => {});
	return c.json({ ok: true });
});
photos.get("/", async (c) => {
	const userId = c.var.userId as string; // Firebase UID
	const {
		take = 25,
		cursor,
		group = "ymd",
		presign = true,
		ttl = 300,
	} = ListQuery.parse(c.req.query());
	console.log("auth userId (from middleware):", userId, typeof userId);

	const [total, mine, sample, curdb] = await Promise.all([
		prisma.photo.count(),
		prisma.photo.count({ where: { userId } }),
		prisma.photo.findFirst({
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		}),
		prisma.$queryRaw<
			Array<{ current_database: string }>
		>`select current_database()`,
	]);

	console.log("DB name:", curdb?.[0]?.current_database);
	console.log("photo total:", total, "mine:", mine);
	console.log("latest sample:", {
		id: sample?.id,
		userId: sample?.userId,
		createdAt: sample?.createdAt,
	});
	// --- 1. DBから取得 ---
	const rows = await prisma.photo.findMany({
		where: { userId },
		take,
		...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		include: {
			_count: { select: { PhotoComment: true, PhotoFavorite: true } },
			PhotoFavorite: { where: { userId }, select: { userId: true } },
		},
	});
	console.log("rows", rows);

	// --- 2. presign URL付与 ---
	const isImageKey = (key: string) => /\.(jpe?g|png|webp|gif|heic)$/i.test(key);

	const withUrls = await Promise.all(
		rows.map(async (r) => {
			let previewUrl: string | null = null;
			if (presign && isImageKey(r.objectKey)) {
				previewUrl = await getSignedUrl(
					s3,
					new GetObjectCommand({ Bucket: BUCKET_NAME, Key: r.objectKey }),
					{ expiresIn: ttl },
				);
			}
			return { ...r, previewUrl };
		}),
	);

	// --- 3. 整形 ---
	const items = withUrls.map((r) => ({
		id: r.id,
		objectKey: r.objectKey,
		mime: r.mime,
		bytes: r.bytes,
		createdAt: r.createdAt,
		width: r.width,
		height: r.height,
		exifJson: r.exifJson,
		status: r.status,
		previewUrl: r.previewUrl,
		favoriteCount: r._count.PhotoFavorite,
		commentCount: r._count.PhotoComment,
		isFavorited: r.PhotoFavorite.length > 0,
	}));

	// --- 4. グルーピング（年月/年月日）---
	const grouped: Record<string, typeof items> = {};
	const keyOf = (d: Date) => {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		if (group === "ym") return `${y}-${m}`;
		if (group === "ymd") return `${y}-${m}-${day}`;
		return "all";
	};

	if (group === "all") {
		grouped.all = items;
	} else {
		for (const it of items) {
			const k = keyOf(it.createdAt);
			(grouped[k] ??= []).push(it);
		}
	}

	const nextCursor = rows.length === take ? (rows.at(-1)?.id ?? null) : null;

	return c.json({ grouped, nextCursor });
});
