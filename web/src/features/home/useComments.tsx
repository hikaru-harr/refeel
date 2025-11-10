// src/hooks/useComments.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	deleteComment,
	fetchComments,
	type PhotoComment,
	postComment,
} from "../../api/photos";

/** 読み取り：photoId ごとに Query する */
export function useCommentsList(photoId: string | null) {
	return useQuery({
		enabled: !!photoId,
		queryKey: ["comments", photoId],
		queryFn: () => fetchComments(photoId!),
		staleTime: 15_000,
	});
}

/** 操作系：呼ぶときに photoId を渡す（create/delete） */
export function useCommentActions() {
	const qc = useQueryClient();

	// 追加
	const createComment = useMutation({
		mutationFn: ({ photoId, body }: { photoId: string; body: string }) =>
			postComment(photoId, body),

		onMutate: async ({ photoId, body }) => {
			const tempId = `temp-${crypto.randomUUID()}`;
			const now = new Date().toISOString();

			const prevC = qc.getQueryData<any>(["comments", photoId]);
			qc.setQueryData(["comments", photoId], (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old);
				draft.items = [
					...draft.items,
					{ id: tempId, photoId, body, createdAt: now } as PhotoComment,
				];
				return draft;
			});

			const prevP = qc.getQueriesData({ queryKey: ["photos"] });
			qc.setQueriesData({ queryKey: ["photos"] }, (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old);
				for (const page of draft.pages ?? []) {
					const grouped = page.grouped as Record<string, any[]>;
					for (const k of Object.keys(grouped ?? {})) {
						grouped[k] = grouped[k].map((it) =>
							it.id === photoId
								? { ...it, commentCount: (it.commentCount ?? 0) + 1 }
								: it,
						);
					}
				}
				return draft;
			});

			return { tempId, photoId, prevC, prevP };
		},

		onError: (_e, _vars, ctx) => {
			if (!ctx) return;
			const { photoId, prevC, prevP } = ctx as any;
			if (prevC) qc.setQueryData(["comments", photoId], prevC);
			if (prevP) for (const [key, val] of prevP) qc.setQueryData(key, val);
		},

		onSuccess: (data, _vars, ctx) => {
			if (!ctx) return;
			const { photoId, tempId } = ctx as any;
			qc.setQueryData(["comments", photoId], (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old);
				draft.items = draft.items.map((it: PhotoComment) =>
					it.id === tempId ? data.item : it,
				);
				return draft;
			});
		},

		onSettled: (_d, _e, vars) => {
			qc.invalidateQueries({ queryKey: ["comments", vars.photoId] });
			qc.invalidateQueries({ queryKey: ["photos"] });
		},
	});

	// 削除
	const deleteCommentMutation = useMutation({
		mutationFn: ({
			photoId,
			commentId,
		}: {
			photoId: string;
			commentId: string;
		}) => deleteComment(photoId, commentId),

		onMutate: async ({ photoId, commentId }) => {
			const prevC = qc.getQueryData<any>(["comments", photoId]);
			let removed = false;

			qc.setQueryData(["comments", photoId], (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old);
				const before = draft.items.length;
				draft.items = draft.items.filter(
					(c: PhotoComment) => c.id !== commentId,
				);
				removed = draft.items.length < before;
				return draft;
			});

			let prevP: any;
			if (removed) {
				prevP = qc.getQueriesData({ queryKey: ["photos"] });
				qc.setQueriesData({ queryKey: ["photos"] }, (old: any) => {
					if (!old) return old;
					const draft = structuredClone(old);
					for (const page of draft.pages ?? []) {
						const grouped = page.grouped as Record<string, any[]>;
						for (const k of Object.keys(grouped ?? {})) {
							grouped[k] = grouped[k].map((it) =>
								it.id === photoId
									? {
											...it,
											commentCount: Math.max(0, (it.commentCount ?? 0) - 1),
										}
									: it,
							);
						}
					}
					return draft;
				});
			}

			return { photoId, prevC, prevP, removed };
		},

		onError: (_e, _vars, ctx) => {
			if (!ctx) return;
			const { photoId, prevC, prevP } = ctx as any;
			if (prevC) qc.setQueryData(["comments", photoId], prevC);
			if (prevP) for (const [key, val] of prevP) qc.setQueryData(key, val);
		},

		onSettled: (_d, _e, vars) => {
			qc.invalidateQueries({ queryKey: ["comments", vars.photoId] });
			qc.invalidateQueries({ queryKey: ["photos"] });
		},
	});

	return { createComment, deleteComment: deleteCommentMutation };
}
