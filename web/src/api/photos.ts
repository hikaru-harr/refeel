import type { ListCommentsResponse, PhotoComment, PhotoItem } from "@refeel/shared/photo.js";
import { getAuth } from "firebase/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

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
			Authorization: `Bearer ${localStorage.getItem('firebase_token') ?? ''}`,
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
			Authorization: `Bearer ${localStorage.getItem('firebase_token') ?? ''}`,
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

export async function fetchComments(photoId: string): Promise<ListCommentsResponse> {
	const token = await getAuth().currentUser?.getIdToken(true);

	const r = await fetch(`${API_BASE}/photos/${photoId}/comments`, {
		method: "GET",
		headers: {
			"content-type": "application/json",
			Authorization: `Bearer ${token}`,
		}
	});
	if (!r.ok) throw new Error("Failed to fetch comments");
	return r.json();
}

// 投稿
export async function postComment(photoId: string, body: string): Promise<{ item: PhotoComment }> {
	const token = await getAuth().currentUser?.getIdToken(true);

	const r = await fetch(`${API_BASE}/photos/${photoId}/comments`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, },
		body: JSON.stringify({ body }),
	});
	if (!r.ok) throw new Error("Failed to post comment");
	return r.json();
}

// 削除
export async function deleteComment(photoId: string, commentId: string): Promise<{ ok: true }> {
	const token = await getAuth().currentUser?.getIdToken(true);

	const r = await fetch(`${API_BASE}/photos/${photoId}/comments/${commentId}`, {
		method: "DELETE",
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, },
	});
	if (!r.ok) throw new Error("Failed to delete comment");
	return r.json();
}