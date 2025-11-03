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

export async function getUploadFile() {
	const res = await fetch(`${API_BASE}/storage?prefix=photos/&presign=1`, {
		method: "GET",
		headers: {
			Accept: "application/json",
		},
	});
	return (await res.json()) as StorageListResponse;
}

export async function presignUpload(contentType: string, key?: string) {
	const res = await fetch(`${API_BASE}/storage/presign/upload`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ contentType, key }),
	});
	if (!res.ok) throw new Error(`presign failed: ${res.status}`);
	return (await res.json()) as PresignUploadRes;
}

export async function presignDownload(key: string) {
	const res = await fetch(
		`${API_BASE}/storage/presign/download?key=${encodeURIComponent(key)}`,
	);
	if (!res.ok) throw new Error(`presign download failed: ${res.status}`);
	return (await res.json()) as { key: string; url: string; expiresIn: number };
}
