import { LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { PhotoItem } from "@/api/photos";
import type { StorageItem } from "@/api/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFileUpload from "./useFileUpload";

interface Props {
	setFiles: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
}

function FileUploadArea({ setFiles }: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const { handleSelectFiles, isError, isUploading } = useFileUpload({
		setFiles,
	});

	// D&D中の見た目用（任意）
	const [isDragOver, setIsDragOver] = useState(false);

	return (
		<div
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragOver(true);
			}}
			onDragLeave={() => setIsDragOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setIsDragOver(false);
				if (e.dataTransfer.files?.length) {
					handleSelectFiles(e.dataTransfer.files);
				}
			}}
			className={[
				"mt-6 rounded-2xl border-2 border-dashed",
				"p-6 text-center transition-colors",
				isDragOver ? "bg-muted/60 border-primary" : "bg-transparent",
			].join(" ")}
			role="button"
			tabIndex={0}
			onClick={() => inputRef.current?.click()}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
			}}
			aria-label="画像をドラッグ＆ドロップ、またはクリックして選択"
		>
			<div className="flex justify-center">
				<Button
					disabled={isUploading}
					onClick={(e) => {
						e.stopPropagation();
						inputRef.current?.click();
					}}
					className="h-12 rounded-full w-[250px] cursor-pointer"
				>
					{isUploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
					写真をアップロード
				</Button>
				<Input
					ref={inputRef}
					onChange={(e) => {
						if (e.target.files?.length) {
							handleSelectFiles(e.target.files);
							// 同じファイルを続けて選べるように
							e.currentTarget.value = "";
						}
					}}
					type="file"
					className="hidden"
					multiple
					accept="image/*"
				/>
			</div>

			<p className="mt-3 text-sm text-muted-foreground">
				ここにドラッグ＆ドロップもできます（複数可）
			</p>

			{isError && (
				<p className="text-red-400 text-center mt-2">
					ファイルを選択してください
				</p>
			)}
		</div>
	);
}

export default FileUploadArea;
