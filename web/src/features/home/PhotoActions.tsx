import type { PhotoItemType } from "@refeel/shared/photo.js";
import { MessageCircleMore, Send, Star, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePhotoActgions from "./usePhotoActgions";

interface Props {
	file: PhotoItemType;
}

function PhotoActions({ file }: Props) {

	const {
		toggleFav,
		getInput,
		sendComment,
		setInput
	} = usePhotoActgions()

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
				className={`absolute bottom-[120px] right-0 cursor-pointer rounded-full w-12 h-12 grid place-items-center shadow ${file.isFavorited
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
				className="absolute bottom-[180px] right-0 cursor-pointer rounded-full w-12 h-12 grid place-items-center bg-blue-500 text-white shadow"
				onClick={() => console.log("Open comment thread for", file.id)}
				title="コメント"
				aria-label="コメント"
			>
				<MessageCircleMore />
			</button>
		</div>
	);
}

export default PhotoActions;
