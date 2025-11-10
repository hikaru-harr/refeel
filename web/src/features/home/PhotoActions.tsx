import type { PhotoItemType } from "@refeel/shared/photo.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircleMore, Send, Star, Tag } from "lucide-react";
import { useCallback, useState } from "react";
import { favOff, favOn } from "@/api/photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommentActions } from "./useComments";

interface Props {
	file: PhotoItemType;
}

function PhotoActions({ file }: Props) {
	const qc = useQueryClient();
	const { createComment } = useCommentActions();

	// 写真ごとの入力テキスト（複数ダイアログをまたいでも保持）
	const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
		{},
	);

	const toggleFav = useMutation({
		mutationFn: async (file: PhotoItemType) =>
			file.isFavorited ? favOff(file.id) : favOn(file.id),
		onMutate: async (file) => {
			const qk = ["photos"];
			const prev = qc.getQueryData<any>(qk);
			qc.setQueryData(qk, (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old);
				for (const page of draft.pages ?? []) {
					const grouped: Record<string, PhotoItemType[]> = page.grouped;
					for (const key of Object.keys(grouped ?? {})) {
						grouped[key] = grouped[key].map((it) =>
							it.id === file.id
								? {
										...it,
										isFavorited: !it.isFavorited,
										favoriteCount: Math.max(
											0,
											(it.favoriteCount ?? 0) + (it.isFavorited ? -1 : 1),
										),
									}
								: it,
						);
					}
				}
				return draft;
			});
			return { prev, qk };
		},
		onError: (_e, _v, ctx) => {
			if (ctx?.prev && ctx.qk) qc.setQueryData(ctx.qk, ctx.prev);
		},
		onSettled: () => qc.invalidateQueries({ queryKey: ["photos"] }),
	});

	const setInput = useCallback((photoId: string, v: string) => {
		setCommentInputs((m) => ({ ...m, [photoId]: v }));
	}, []);

	const sendComment = useCallback(
		(photoId: string) => {
			const body = (commentInputs[photoId] ?? "").trim();
			if (!body) return;
			createComment.mutate({ photoId, body });
			setInput(photoId, "");
		},
		[commentInputs, createComment, setInput],
	);

	// 入力値getter/setter（余計な再レンダを避けるため useCallback）
	const getInput = useCallback(
		(photoId: string) => commentInputs[photoId] ?? "",
		[commentInputs],
	);

	return (
		<div className="relative w-full">
			<div className="flex items-center gap-2">
				<Input
					type="text"
					value={getInput(file.id)}
					onChange={(e) => setInput(file.id, e.target.value)}
					placeholder="コメントを追加"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							sendComment(file.id);
						}
					}}
				/>
				<Button
					size="icon"
					onClick={() => sendComment(file.id)}
					title="コメント送信"
				>
					<Send />
				</Button>
			</div>

			{/* 右側FAB群 */}
			<div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col items-end justify-center gap-3 pr-1">
				<button
					type="button"
					className="pointer-events-auto rounded-full w-12 h-12 grid place-items-center bg-violet-500 text-white shadow"
					onClick={() => console.log("Recommend start:", file.objectKey)}
					title="AIタグ生成"
					aria-label="AIタグ生成"
				>
					<Tag />
				</button>

				<button
					type="button"
					className={`pointer-events-auto rounded-full w-12 h-12 grid place-items-center shadow ${
						file.isFavorited
							? "bg-yellow-400 text-black"
							: "bg-neutral-300 text-gray-700"
					}`}
					onClick={() => toggleFav.mutate(file)}
					title={file.isFavorited ? "お気に入り解除" : "お気に入り"}
					aria-label="お気に入り"
				>
					<Star />
				</button>

				<button
					type="button"
					className="pointer-events-auto rounded-full w-12 h-12 grid place-items-center bg-blue-500 text-white shadow"
					onClick={() => console.log("Open comment thread for", file.id)}
					title="コメント"
					aria-label="コメント"
				>
					<MessageCircleMore />
				</button>
			</div>
		</div>
	);
}

export default PhotoActions;
