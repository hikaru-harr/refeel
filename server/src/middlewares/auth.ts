// server/src/middlewares/auth.ts

import { getAuth } from "firebase-admin/auth";
import type { Context, Next } from "hono";
import { decodeJwt } from "jose";
import { app } from "../lib/firebase.js";

export async function useAuth(c: Context, next: Next) {
	const authz = c.req.header("authorization");
	let userId: string | null = null;

	if (!authz?.startsWith("Bearer ")) {
		console.warn("No Bearer token");
		return c.text("Unauthorized", 401);
	}

	const idToken = authz.slice(7);

	// 1) 先頭だけログ（漏洩防止）
	console.log("tokenHead:", idToken.slice(0, 12));

	// 2) 事前にペイロードを“検証なし”で覗く（aud/iss/sub を確認）
	try {
		const decodedPreview = decodeJwt(idToken);
		console.log("preview claims:", {
			sub: decodedPreview.sub,
			aud: decodedPreview.aud,
			iss: decodedPreview.iss,
		});
	} catch (e) {
		console.error("decodeJwt failed:", (e as Error).message);
	}

	// 3) 本検証（まずは revoked チェック無しで）
	try {
		const decoded = await getAuth(app).verifyIdToken(
			idToken /*, true を一旦外す */,
		);
		userId = decoded.uid;
		console.log("verify OK uid:", userId);
	} catch (e) {
		console.error("verifyIdToken failed:", (e as Error).message);
		return c.text("Unauthorized", 401);
	}

	c.set("userId", userId);
	await next();
}
