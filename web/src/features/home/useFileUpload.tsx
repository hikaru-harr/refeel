import type React from "react";
import { useState } from "react";
import {
	type PresignUploadRes,
	presignUpload,
	type StorageItem,
} from "@/api/storage";
import { uploadToSignedUrl } from "@/lib/upload";

// 3) ダウンロードURL（確認用）
// const d = await presignDownload(key);

interface Props {
	setFiles: React.Dispatch<React.SetStateAction<StorageItem[]>>;
}

const toStorageItem = (file: File, r: PresignUploadRes): StorageItem => ({
	key: r.key,
	previewUrl: r.previewUrl ?? null, // サーバで追加済み
	size: file.size, // S3のListで返るsizeとは一致しない場合あり（実害は少）
	lastModified: new Date().toISOString(), // 今の時刻で楽観的に埋める
});

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
		try {
			setIsUploading(true);
			setIsError(false);

			// 1) アップロード先・プレビューURLを取得
			const presigned = await presignUpload(file.type);

			// 2) PUTでアップロード
			const res = await uploadToSignedUrl(presigned.url, file);
			if (!res.ok) throw new Error(`PUT failed: ${res.status}`);

			setFiles((current) => [toStorageItem(file, presigned), ...current]);
		} catch (e) {
			console.error(e);
			setIsError(true);
		} finally {
			setIsUploading(false);
		}
	};

	return {
		isError,
		isUploading,
		handleSelectFile,
	};
};

export default useFileUpload;
