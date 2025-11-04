// src/routes/photos.ts

import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const photos = new Hono();

// コメント追加
photos.post("/:id/comments", async (c) => {
	const userId = (c.get("userId") as string) ?? "guest";
	const id = c.req.param("id");
	const { body } = await c.req.json<{ body: string }>();
	if (!body?.trim()) return c.text("body required", 400);

	const created = await prisma.photoComment.create({
		data: { photoId: id, userId, body },
	});
	return c.json(created, 201);
});

// コメント一覧
photos.get("/:id/comments", async (c) => {
	const id = c.req.param("id");
	const list = await prisma.photoComment.findMany({
		where: { photoId: id },
		orderBy: { createdAt: "desc" },
		take: 100,
	});
	return c.json(list);
});

// お気に入りトグル
photos.post("/:id/favorite", async (c) => {
	const userId = (c.get("userId") as string) ?? "guest";
	const id = c.req.param("id");

	const exists = await prisma.photoFavorite.findUnique({
		where: { photoId_userId: { photoId: id, userId } },
	});
	if (exists) {
		await prisma.photoFavorite.delete({
			where: { photoId_userId: { photoId: id, userId } },
		});
		return c.json({ favorited: false });
	} else {
		await prisma.photoFavorite.create({ data: { photoId: id, userId } });
		return c.json({ favorited: true });
	}
});

// タグ付け（手動）
photos.post("/:id/tags", async (c) => {
	const id = c.req.param("id");
	const { names } = await c.req.json<{ names: string[] }>();
	if (!Array.isArray(names) || names.length === 0)
		return c.text("names[] required", 400);

	// upsert して PhotoTag にINSERT
	const tags = await Promise.all(
		names.map(async (name) => {
			const t = await prisma.tag.upsert({
				where: { name },
				update: {},
				create: { name },
				select: { id: true, name: true },
			});
			await prisma.photoTag.upsert({
				where: { photoId_tagId: { photoId: id, tagId: t.id } },
				update: {},
				create: { photoId: id, tagId: t.id },
			});
			return t;
		}),
	);

	return c.json({ added: tags });
});

// 検索（MVP: タグ名 / コメント / objectKey / mime / 日付）
photos.get("/search", async (c) => {
	const q = (c.req.query("q") ?? "").trim();
	const tag = c.req.query("tag") ?? "";
	const fav = c.req.query("favorite") === "1";
	const dateFrom = c.req.query("from"); // "2025-01-01"
	const dateTo = c.req.query("to");

	const userId = (c.get("userId") as string) ?? "guest";

	// 基本条件
	const where: any = {};
	if (q) {
		// 簡易ILIKE検索：objectKey と コメント本文
		where.OR = [
			{ objectKey: { contains: q, mode: "insensitive" } },
			{ mime: { contains: q, mode: "insensitive" } },
			{ comments: { some: { body: { contains: q, mode: "insensitive" } } } },
			{
				tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } },
			},
		];
	}
	if (tag) {
		where.tags = { some: { tag: { name: { equals: tag } } } };
	}
	if (dateFrom || dateTo) {
		where.createdAt = {};
		if (dateFrom) where.createdAt.gte = new Date(dateFrom);
		if (dateTo) where.createdAt.lte = new Date(dateTo);
	}
	if (fav) {
		where.favorites = { some: { userId } };
	}

	const list = await prisma.photo.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: 50,
		include: {
			tags: { include: { tag: true } },
			_count: { select: { comments: true, favorites: true } },
		},
	});

	return c.json(list);
});
