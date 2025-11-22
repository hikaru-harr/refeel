import type { PhotoItemType } from "@refeel/shared/photo.js";
import { MessageCircle, MessageCircleMore, Send, Star, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePhotoActgions from "./usePhotoActgions";
import { useState, memo } from "react";
import CommentDialog from "./CommentDialog";

interface Props {
	file: PhotoItemType;
}

const PhotoActions = memo(({ file }: Props) => {
	const [isFavorited, setIsFavorited] = useState(file.isFavorited)
	const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)

	const {
		toggleFav,
		getInput,
		sendComment,
		setInput
	} = usePhotoActgions()

	return (
		<div className="relative w-full">
			{isCommentDialogOpen && <CommentDialog fileId={file.id} setIsCommentDialogOpen={setIsCommentDialogOpen} />}
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

			<button
				type="button"
				className="absolute bottom-[60px] right-0  cursor-pointer rounded-full w-12 h-12 grid place-items-center bg-violet-500 text-white shadow"
				onClick={() => console.log("Recommend start:", file.objectKey)}
				title="AIタグ生成"
				aria-label="AIタグ生成"
			>
				<Tag />
			</button>

			<button
				type="button"
				className={`absolute bottom-[120px] right-0 cursor-pointer rounded-full w-12 h-12 grid place-items-center shadow ${isFavorited
					? "bg-yellow-400 text-black"
					: "bg-neutral-300 text-gray-700"
					}`}
				onClick={() => {
					toggleFav.mutate(file);
					setIsFavorited(!isFavorited)
				}}
			>
				<Star />
			</button>

			<button
				type="button"
				className="absolute bottom-[180px] right-0 cursor-pointer rounded-full w-12 h-12 grid place-items-center bg-blue-500 text-white shadow"
				onClick={() => setIsCommentDialogOpen(true)}
				title="コメント"
				aria-label="コメント"
			>
				<div className="relative flex justify-center items-center">
					<small className="absolute ">1</small>
					<MessageCircle />
				</div>
			</button>
		</div>
	);
})

export default PhotoActions;
