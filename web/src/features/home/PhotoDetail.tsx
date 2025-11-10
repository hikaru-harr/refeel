import type {
	ListPhotosResponse,
	PhotoItemType,
} from "@refeel/shared/photo.js";
import type {
	InfiniteData,
	UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import PhotoActions from "./PhotoActions";
import PhotoItem from "./PhotoItem";
import { useCommentActions, useCommentsList } from "./useComments";

interface Props {
	file: PhotoItemType;
	fetchPhotoQuery: UseInfiniteQueryResult<
		InfiniteData<ListPhotosResponse, unknown>,
		Error
	>;
}

const PhotoDetail = ({ file, fetchPhotoQuery }: Props) => {
	// いま開いている写真
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// ① コメント一覧取得は「開いている1件分だけ」
	const comments = useCommentsList(selectedId);

	// ② 操作系（投稿/削除）は一度だけ作る → 呼ぶときに { photoId, ... }
	const { deleteComment } = useCommentActions();

	const onOpen = useCallback((open: boolean, id: string) => {
		if (open) setSelectedId(id);
		else setSelectedId(null);
	}, []);

	return (
		<Dialog key={file.id} onOpenChange={(open) => onOpen(open, file.id)}>
			<DialogTrigger asChild>
				<PhotoItem file={file} fetchPhotoQuery={fetchPhotoQuery} />
			</DialogTrigger>

			<DialogContent className="h-screen w-screen flex flex-col">
				{/* Header */}
				<DialogHeader className="p-4">
					<DialogClose
						className="absolute top-6 left-6 cursor-pointer"
						aria-label="閉じる"
					>
						<ArrowLeft />
					</DialogClose>
					<DialogTitle>
						{new Date(file.createdAt).toLocaleDateString()}
					</DialogTitle>
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
						onError={() => fetchPhotoQuery.refetch()}
					/>
				</div>

				{/* コメント一覧（開いてるダイアログの時だけ読み取り済み） */}
				<div className="px-4 pb-2 overflow-y-auto grow">
					<div className="mb-2 flex items-center gap-2">
						<h3 className="text-sm font-semibold">コメント</h3>
						<span className="text-xs text-neutral-500">
							{file.commentCount}件
						</span>
					</div>

					<div className="space-y-2">
						{selectedId === file.id
							? (comments.data?.items ?? []).map((cm) => {
									const canDelete = "";
									return (
										<div
											key={cm.id}
											className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<div className="text-xs text-neutral-500">
														{new Date(cm.createdAt).toLocaleString()}
													</div>
													<div className="text-sm whitespace-pre-wrap break-words">
														{cm.body}
													</div>
												</div>
												{canDelete && (
													<button
														className="shrink-0 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
														onClick={() =>
															deleteComment.mutate({
																photoId: file.id,
																commentId: cm.id,
															})
														}
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

				<DialogFooter className="p-4">
					<PhotoActions file={file} />
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default PhotoDetail;
