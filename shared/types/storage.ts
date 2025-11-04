import { z } from "zod";

export const CompleteBody = z.object({
	key: z.string().min(1),
	mime: z.string().min(1),
	bytes: z.coerce.number().int().min(1),
	sha256: z.string().min(1).optional(), // 任意（重複検知などに利用）
	exifHint: z.record(z.any()).optional(), // 任意（撮影日時などヒント）
});
