const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export type PhotoItem = {
	id: string;
	objectKey: string;
	mime: string | null;
	bytes: number | null;
	createdAt: string; // ISO
	width: number | null;
	height: number | null;
	exifJson: Record<string, unknown> | null;
	status: string;
	previewUrl: string | null;
	favoriteCount: number;
	commentCount: number;
	isFavorited: boolean;
};

export type ListPhotosResponse = {
	grouped: Record<string, PhotoItem[]>; // group=all のときは { all: PhotoItem[] }
	nextCursor: string | null;
};

export async function fetchPhotos({
	cursor,
	group = "ymd" as const,
	take = 50,
}: {
	cursor?: string;
	group?: "ym" | "ymd" | "all";
	take?: number;
}) {
	const q = new URLSearchParams();
	q.set("take", String(take));
	if (cursor) q.set("cursor", cursor);
	q.set("group", group);
	q.set("presign", "1");
	const res = await fetch(`${API_BASE}/photos?${q.toString()}`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${localStorage.getItem('firebase_token') ?? ''}`, // ← Firebase Authから取得
		},
	});
	return (await res.json()) as {
		grouped: Record<string, PhotoItem[]>;
		nextCursor: string | null;
	};
}

export async function favOn(photoId: string) {
	const res = await fetch(`${API_BASE}/photos/${photoId}/favorite`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${localStorage.getItem('firebase_token') ?? ''}`, // ← Firebase Authから取得
		},
	});

	if (!res.ok) throw new Error('Failed to add favorite');
	return res.json();
}

export async function favOff(photoId: string) {
	const res = await fetch(`${API_BASE}/photos/${photoId}/favorite`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${localStorage.getItem('firebase_token') ?? ''}`,
		},
	});

	if (!res.ok) throw new Error('Failed to remove favorite');
	return res.json();
}
