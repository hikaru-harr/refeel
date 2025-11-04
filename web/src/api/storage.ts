import { getAuth } from "firebase/auth";
import { FirebaseAuthAdapter } from "@/lib/firebase";

const authAdapter = new FirebaseAuthAdapter();

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export type PresignUploadRes = {
	key: string;
	url: string; // PUT先
	previewUrl: string; // GET(プレビュー/ダウンロード)
	expiresIn: number; // 秒
};

export type StorageItem = {
	key: string;
	size: number;
	lastModified: string | null;
	previewUrl: string | null; // ← 追加
};

export type StorageListResponse = {
	items: StorageItem[];
	nextToken: string | null;
	prefix: string | null;
	limit: number;
};

type CompleteBody = {
	key: string;
	mime: string;
	bytes: number;
	sha256: string;
	exifHint: Record<string, unknown>;
};

export async function getUploadFile() {
	const token = await authAdapter.getIdToken();
	console.log(token);
	const res = await fetch(`${API_BASE}/storage?prefix=photos/&presign=1`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	});
	return (await res.json()) as StorageListResponse;
}

export async function presignUpload(contentType: string, key?: string) {
	const token = await getAuth().currentUser?.getIdToken(true);

	const res = await fetch(`${API_BASE}/storage/presign/upload`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ contentType, key }),
	});
	if (!res.ok) throw new Error(`presign failed: ${res.status}`);
	return (await res.json()) as PresignUploadRes;
}

export async function presignDownload(key: string) {
	const token = await getAuth().currentUser?.getIdToken(true);
	const res = await fetch(
		`${API_BASE}/storage/presign/download?key=${encodeURIComponent(key)}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	if (!res.ok) throw new Error(`presign download failed: ${res.status}`);
	return (await res.json()) as { key: string; url: string; expiresIn: number };
}

export async function uploadCompleat({
	key,
	mime,
	bytes,
	sha256,
	exifHint,
}: CompleteBody) {
	const token = await getAuth().currentUser?.getIdToken(true);

	const res = await fetch(`${API_BASE}/storage/complete`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			key,
			mime,
			bytes,
			sha256,
			exifHint,
		}),
	});
	if (!res.ok) throw new Error(`presign download failed: ${res.status}`);
	return (await res.json()) as { key: string; url: string; expiresIn: number };
}
