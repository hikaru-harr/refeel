import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFileUpload from "./useFileUpload";

function FileUploadArea() {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const { handleSelectFile, isError } = useFileUpload();

	return (
		<div>
			<div className="flex justify-center mt-6">
				<Button
					onClick={() => inputRef.current?.click()}
					className="h-12 rounded-full w-[250px]"
				>
					<Upload />
					写真をアップロード
				</Button>
				<Input
					ref={inputRef}
					onChange={handleSelectFile}
					type="file"
					className="hidden"
				/>
			</div>
			{isError && <p className="text-red-400 text-center mt-2">ファイルを選択してください</p>}
		</div>
	);
}

export default FileUploadArea;
