import { z } from "zod";

export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(8),
});

export interface LoginType extends z.infer<typeof loginSchema> {}
