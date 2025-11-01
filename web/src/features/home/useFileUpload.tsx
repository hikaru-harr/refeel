import type React from "react";
import { useState } from "react";
import { presignUpload, type StorageItem } from "@/api/storage";
import { uploadToSignedUrl } from "@/lib/upload";

// 3) ダウンロードURL（確認用）
// const d = await presignDownload(key);

interface Props {
	setFiles: React.Dispatch<React.SetStateAction<StorageItem[]>>;
}

const useFileUpload = ({ setFiles }: Props) => {
	const [isUploading, setIsUploading] = useState(false);
	const [isError, setIsError] = useState(false);

	const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		console.log("handleSelectFile");
		setIsUploading(true);
		setIsError(false);

		const selectedFile = e.target.files?.[0];

		if (!selectedFile) {
			setIsError(true);
			return;
		}

		await onUpload(selectedFile);
	};

	const onUpload = async (file: File) => {
		console.log(onUpload);
		console.log(file);
		const uploadData = await presignUpload(file.type);
		const response = await uploadToSignedUrl(uploadData.url, file);
		if (!response.ok) {
			setIsError(true);
			return;
		}
		setFiles((current) => [uploadData, ...current]);
		setIsUploading(false);
	};

	return {
		isError,
		isUploading,
		handleSelectFile,
	};
};

export default useFileUpload;
