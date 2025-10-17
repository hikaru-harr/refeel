import crypto from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { BUCKET_NAME, s3 } from "../lib/bucket.js";

const UploadBody = z.object({
	contentType: z.string().min(1),
	key: z.string().min(1).optional(),
});
const DownloadQuery = z.object({ key: z.string().min(1) });

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

export const storage = new Hono()
	.post("/presign/upload", zValidator("json", UploadBody), async (c) => {
		const { contentType, key: rawKey } = c.req.valid("json");
		const key = rawKey ?? makeKey(extFrom(contentType));
		const url = await getSignedUrl(
			s3,
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
				ContentType: contentType,
			}),
			{ expiresIn: 300 },
		);
		return c.json({ key, url, expiresIn: 300 });
	})
	.get("/presign/download", zValidator("query", DownloadQuery), async (c) => {
		const { key } = c.req.valid("query");
		const url = await getSignedUrl(
			s3,
			new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
			{ expiresIn: 300 },
		);
		return c.json({ key, url, expiresIn: 300 });
	});
