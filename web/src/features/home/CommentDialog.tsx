import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, X } from "lucide-react";
import { useCommentActions, useCommentsList } from "./useComments";

interface Props {
    fileId: string;
    setIsCommentDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function CommentDialog({ fileId, setIsCommentDialogOpen }: Props) {
    /**
     * コメント一覧の取得
     * コメントの追加
     * 
    */
    const comments = useCommentsList(fileId);
    const { deleteComment } = useCommentActions()
    return (
        <AlertDialog open={true} onOpenChange={() => setIsCommentDialogOpen(false)}>
            <AlertDialogContent>
                <AlertDialogHeader className="flex justify-center items-center">
                    <AlertDialogCancel className="absolute right-0">
                        <X />
                    </AlertDialogCancel>
                </AlertDialogHeader>
                <div className="space-y-2">
                    {(comments.data?.items ?? []).map((cm) => {
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
                                                    photoId: fileId,
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
                    }
                </div>
                <AlertDialogFooter className="w-full">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            // value={getInput(file.id)}
                            // onChange={(e) => setInput(file.id, e.target.value)}
                            placeholder="コメントを追加"
                        // onKeyDown={(e) => {
                        //     if (e.key === "Enter" && !e.shiftKey) {
                        //         e.preventDefault();
                        //         sendComment(file.id);
                        //     }
                        // }}
                        />
                        <Button
                            size="icon"
                            // onClick={() => sendComment(file.id)}
                            title="コメント送信"
                        >
                            <Send />
                        </Button>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        // <Dialog open={true} onOpenChange={() => setIsCommentDialogOpen(false)}>
        //     <DialogContent className="h-screen w-screen flex flex-col">
        //         {/* Header */}
        //         <DialogHeader className="p-4">
        //             <DialogClose
        //                 className="absolute top-6 left-6 cursor-pointer"
        //                 aria-label="閉じる"
        //             >
        //                 <ArrowLeft />
        //             </DialogClose>
        //             <DialogTitle>
        //                 {new Date(file.createdAt).toLocaleDateString()}
        //             </DialogTitle>
        //             <DialogDescription className="flex items-center gap-2">
        //                 <span className="truncate">{file.mime}</span>
        //                 <span className="text-xs text-neutral-400">・</span>
        //                 <span className="text-xs text-neutral-500">
        //                     {file.width && file.height ? `${file.width}×${file.height}` : ""}
        //                 </span>
        //             </DialogDescription>
        //         </DialogHeader>

        //         {/* 画像 */}
        //         <div className="relative flex-1 grid place-items-center px-4 overflow-hidden">
        //             <img
        //                 src={file.previewUrl ?? ""}
        //                 alt="preview"
        //                 className="max-w-[calc(100vw-2rem)] max-h-[calc(100svh-8rem)] object-contain"
        //                 onError={() => fetchPhotoQuery.refetch()}
        //             />
        //         </div>

        //         {/* コメント一覧（開いてるダイアログの時だけ読み取り済み） */}
        //         {/* <div className="px-4 pb-2 overflow-y-auto grow">
        // 			<div className="mb-2 flex items-center gap-2">
        // 				<h3 className="text-sm font-semibold">コメント</h3>
        // 				<span className="text-xs text-neutral-500">
        // 					{file.commentCount}件
        // 				</span>
        // 			</div>

        // 			<div className="space-y-2">
        // 				{(comments.data?.items ?? []).map((cm) => {
        // 					const canDelete = "";
        // 					return (
        // 						<div
        // 							key={cm.id}
        // 							className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2"
        // 						>
        // 							<div className="flex items-start justify-between gap-2">
        // 								<div className="min-w-0">
        // 									<div className="text-xs text-neutral-500">
        // 										{new Date(cm.createdAt).toLocaleString()}
        // 									</div>
        // 									<div className="text-sm whitespace-pre-wrap break-words">
        // 										{cm.body}
        // 									</div>
        // 								</div>
        // 								{canDelete && (
        // 									<button
        // 										className="shrink-0 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
        // 										onClick={() =>
        // 											deleteComment.mutate({
        // 												photoId: file.id,
        // 												commentId: cm.id,
        // 											})
        // 										}
        // 										title="コメントを削除"
        // 										aria-label="コメントを削除"
        // 									>
        // 										<Trash2 size={16} />
        // 									</button>
        // 								)}
        // 							</div>
        // 						</div>
        // 					);
        // 				})
        // 				}
        // 			</div>
        // 		</div> */}

        //         <DialogFooter className="p-4">
        //             <PhotoActions file={file} />
        //         </DialogFooter>
        //     </DialogContent>
        // </Dialog>
    )
}

export default CommentDialog