import { z } from "zod";

export const ListQuery = z.object({
	prefix: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(1000).optional(),
	token: z.string().optional(),
	presign: z.coerce.boolean().optional(), // 例: ?presign=1
	ttl: z.coerce.number().int().min(60).max(3600).optional(), // 例: ?ttl=300
	onlyImages: z.coerce.boolean().optional(), // 例: ?onlyImages=0 で全て署名
});

export const CompleteBody = z.object({
	key: z.string().min(1),
	mime: z.string().min(1),
	bytes: z.coerce.number().int().min(1),
	sha256: z.string().min(1).optional(), // 任意（重複検知などに利用）
	exifHint: z.record(z.string(), z.unknown()).optional(),
});

export const UploadBody = z.object({
	contentType: z.string().min(1),
	key: z.string().min(1).optional(),
});

export const DownloadQuery = z.object({ key: z.string().min(1) });