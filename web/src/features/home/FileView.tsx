// FileView.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircleMore, Send, Star, Tag } from "lucide-react";
import { useState } from "react";
import { favOff, favOn, type PhotoItem } from "@/api/photos";
import { Button } from "@/components/ui/button";
import {
	Dialog, DialogClose, DialogContent, DialogDescription,
	DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
	files: PhotoItem[];
	onImgExpireRefetch?: () => void;
}

function FileView({ files, onImgExpireRefetch }: Props) {
	const qc = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [commentText, setCommentText] = useState("");

	// --- お気に入りトグル（infinite data 対応の楽観更新）---
	const toggleFav = useMutation({
		mutationFn: async (file: PhotoItem) => {
			if (file.isFavorited) return favOff(file.id);
			return favOn(file.id);
		},
		onMutate: async (file) => {
			const qk = ["photos"];
			const prev = qc.getQueryData<any>(qk);
			qc.setQueryData(qk, (old: any) => {
				if (!old) return old;
				const draft = structuredClone(old); // { pages: [...], pageParams: [...] }
				for (const page of draft.pages ?? []) {
					const grouped: Record<string, PhotoItem[]> = page.grouped;
					for (const key of Object.keys(grouped)) {
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
		onError: (_e, _vars, ctx) => {
			if (ctx?.prev && ctx.qk) qc.setQueryData(ctx.qk, ctx.prev); // 巻き戻し
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ["photos"] });
		},
	});

	const handleRecommend = (file: PhotoItem) => {
		console.log("Recommend start:", file.objectKey);
		// TODO: AIタグ生成API
	};

	return (
		<div className="grid grid-flow-row lg:grid-cols-5 md:grid-cols-4 grid-cols-3 gap-1 mt-4">
			{files.map((file) => (
				<Dialog key={file.id} onOpenChange={(open) => open && setSelectedId(file.id)}>
					<DialogTrigger asChild>
						<button type="button" className="cursor-pointer">
							<div className="relative aspect-square overflow-hidden bg-neutral-200">
								<img
									src={file.previewUrl ?? ""}
									alt={file.objectKey}
									className="absolute inset-0 h-full w-full object-cover"
									loading="lazy"
									onError={onImgExpireRefetch} // 署名URL失効 → 軽く取り直し
								/>
							</div>
						</button>
					</DialogTrigger>

					<DialogContent className="h-screen w-screen">
						<DialogHeader className="p-4">
							<DialogClose className="absolute top-6 left-6 cursor-pointer">
								<ArrowLeft />
							</DialogClose>
							<DialogTitle>{new Date(file.createdAt).toLocaleDateString()}</DialogTitle>
							<DialogDescription>{file.mime}</DialogDescription>
						</DialogHeader>

						{/* 画像プレビュー */}
						<div className="relative flex-1 grid place-items-center px-4 overflow-hidden">
							<img
								src={file.previewUrl ?? ""}
								alt="preview"
								className="max-w-[calc(100vw-2rem)] max-h-[calc(100svh-8rem)] object-contain"
								onError={onImgExpireRefetch}
							/>
						</div>

						{/* コメント入力＋ボタン群 */}
						<DialogFooter className="p-4">
							<div className="relative w-full">
								<div className="flex">
									<Input
										type="text"
										value={commentText}
										onChange={(e) => setCommentText(e.target.value)}
										placeholder="コメントを追加"
									/>
									<Button
										size="icon"
										onClick={() => console.log("Send comment:", commentText)}
									>
										<Send />
									</Button>
								</div>

								{/* タグ生成 */}
								<button
									type="button"
									className="absolute right-4 top-[-80px] bg-violet-500 text-white rounded-full w-12 h-12 grid place-items-center"
									onClick={() => handleRecommend(file)}
								>
									<Tag />
								</button>

								{/* お気に入り */}
								<button
									type="button"
									onClick={() => toggleFav.mutate(file)}
									className={`absolute right-4 top-[-140px] rounded-full w-12 h-12 grid place-items-center ${file.isFavorited ? "bg-yellow-400 text-black" : "bg-neutral-300 text-gray-700"
										}`}
								>
									<Star />
								</button>

								{/* コメントアイコン */}
								<button
									type="button"
									className="absolute right-4 top-[-200px] bg-blue-500 text-white rounded-full w-12 h-12 grid place-items-center"
									onClick={() => console.log("Open comment thread for", file.id)}
								>
									<MessageCircleMore />
								</button>
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			))}
		</div>
	);
}

export default FileView;
