// src/components/FileView.tsx
import { useMemo, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft, MessageCircleMore, Send, Star, Tag, Trash2,
} from "lucide-react";
import { favOff, favOn, type PhotoItem } from "@/api/photos";
import { Button } from "@/components/ui/button";
import {
	Dialog, DialogClose, DialogContent, DialogDescription,
	DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCommentsList, useCommentActions } from "./useComments";

type Props = {
	files: PhotoItem[];
	onImgExpireRefetch?: () => void;
	currentUserId?: string;
};

export default function FileView({ files, onImgExpireRefetch, currentUserId }: Props) {
	const qc = useQueryClient();

	// いま開いている写真
	const [selectedId, setSelectedId] = useState<string | null>(null);
	// 写真ごとの入力テキスト（複数ダイアログをまたいでも保持）
	const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

	// ① コメント一覧取得は「開いている1件分だけ」
	const comments = useCommentsList(selectedId);

	// ② 操作系（投稿/削除）は一度だけ作る → 呼ぶときに { photoId, ... }
	const { createComment, deleteComment } = useCommentActions();

	// 入力値getter/setter（余計な再レンダを避けるため useCallback）
	const getInput = useCallback(
		(photoId: string) => commentInputs[photoId] ?? "",
		[commentInputs]
	);
	const setInput = useCallback((photoId: string, v: string) => {
		setCommentInputs((m) => ({ ...m, [photoId]: v }));
	}, []);

	const onOpen = useCallback((open: boolean, id: string) => {
		if (open) setSelectedId(id);
		else setSelectedId(null);
	}, []);

	const sendComment = useCallback((photoId: string) => {
		const body = (commentInputs[photoId] ?? "").trim();
		if (!body) return;
		createComment.mutate({ photoId, body });
		setInput(photoId, "");
	}, [commentInputs, createComment, setInput]);

	// お気に入りトグルは従来通り（infinite query の楽観更新）
	const toggleFav = useMutation({
		mutationFn: async (file: PhotoItem) => (file.isFavorited ? favOff(file.id) : favOn(file.id)),
		onMutate: async (file) => {
			const qk = ["photos"];
			const prev = qc.getQueryData<any>(qk);
			qc.setQueryData(qk, (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old);
				for (const page of draft.pages ?? []) {
					const grouped: Record<string, PhotoItem[]> = page.grouped;
					for (const key of Object.keys(grouped ?? {})) {
						grouped[key] = grouped[key].map((it) =>
							it.id === file.id
								? {
									...it,
									isFavorited: !it.isFavorited,
									favoriteCount: Math.max(0, (it.favoriteCount ?? 0) + (it.isFavorited ? -1 : 1)),
								}
								: it
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

	return (
		<div className="grid grid-flow-row lg:grid-cols-5 md:grid-cols-4 grid-cols-3 gap-1 mt-4">
			{files.map((file) => (
				<Dialog key={file.id} onOpenChange={(open) => onOpen(open, file.id)}>
					<DialogTrigger asChild>
						<button type="button" className="cursor-pointer">
							<div className="relative aspect-square overflow-hidden bg-neutral-200">
								<img
									src={file.previewUrl ?? ""}
									alt={file.objectKey}
									className="absolute inset-0 h-full w-full object-cover"
									loading="lazy"
									onError={onImgExpireRefetch}
								/>
							</div>
						</button>
					</DialogTrigger>

					<DialogContent className="h-screen w-screen flex flex-col">
						{/* Header */}
						<DialogHeader className="p-4">
							<DialogClose className="absolute top-6 left-6 cursor-pointer" aria-label="閉じる">
								<ArrowLeft />
							</DialogClose>
							<DialogTitle>{new Date(file.createdAt).toLocaleDateString()}</DialogTitle>
							<DialogDescription className="flex items-center gap-2">
								<span className="truncate">{file.mime}</span>
								<span className="text-xs text-neutral-400">・</span>
								<span className="text-xs text-neutral-500">
									{file.width && file.height ? `${file.width}×${file.height}` : ""}
								</span>
							</DialogDescription>
						</DialogHeader>

						{/* 画像 */}
						<div className="relative flex-1 grid place-items-center px-4 overflow-hidden">
							<img
								src={file.previewUrl ?? ""}
								alt="preview"
								className="max-w-[calc(100vw-2rem)] max-h-[calc(100svh-8rem)] object-contain"
								onError={onImgExpireRefetch}
							/>
						</div>

						{/* コメント一覧（開いてるダイアログの時だけ読み取り済み） */}
						<div className="px-4 pb-2 overflow-y-auto grow">
							<div className="mb-2 flex items-center gap-2">
								<h3 className="text-sm font-semibold">コメント</h3>
								<span className="text-xs text-neutral-500">{file.commentCount}件</span>
							</div>

							<div className="space-y-2">
								{selectedId === file.id
									? (comments.data?.items ?? []).map((cm) => {
										const canDelete = currentUserId ? cm.userId === currentUserId : false;
										return (
											<div key={cm.id} className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2">
												<div className="flex items-start justify-between gap-2">
													<div className="min-w-0">
														<div className="text-xs text-neutral-500">
															{new Date(cm.createdAt).toLocaleString()}
														</div>
														<div className="text-sm whitespace-pre-wrap break-words">{cm.body}</div>
													</div>
													{canDelete && (
														<button
															className="shrink-0 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
															onClick={() => deleteComment.mutate({ photoId: file.id, commentId: cm.id })}
															title="コメントを削除"
															aria-label="コメントを削除"
														>
															<Trash2 size={16} />
														</button>
													)}
												</div>
											</div>
										);
									})
									: null}
							</div>
						</div>

						{/* 入力＋アクション */}
						<DialogFooter className="p-4">
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
									<Button size="icon" onClick={() => sendComment(file.id)} title="コメント送信">
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
										className={`pointer-events-auto rounded-full w-12 h-12 grid place-items-center shadow ${file.isFavorited ? "bg-yellow-400 text-black" : "bg-neutral-300 text-gray-700"
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
						</DialogFooter>
					</DialogContent>
				</Dialog>
			))}
		</div>
	);
}
