import type React from "react";
import { useState } from "react";
import {
	type PresignUploadRes,
	presignUpload,
	type StorageItem,
	uploadCompleat,
} from "@/api/storage";
import { uploadToSignedUrl } from "@/lib/upload";

interface Props {
	setFiles: React.Dispatch<React.SetStateAction<StorageItem[]>>;
}

const toStorageItem = (file: File, r: PresignUploadRes): StorageItem => ({
	key: r.key,
	previewUrl: r.previewUrl ?? null,
	size: file.size,
	lastModified: new Date().toISOString(),
});

const useFileUpload = ({ setFiles }: Props) => {
	const [isUploading, setIsUploading] = useState(false);
	const [isError, setIsError] = useState(false);

	// ★ 複数対応の本体
	const handleSelectFiles = async (files: FileList | File[]) => {
		const picked = Array.from(files ?? []).filter(Boolean) as File[];
		if (picked.length === 0) {
			setIsError(true);
			return;
		}

		setIsUploading(true);
		setIsError(false);

		try {
			// ここでは順次アップロード（並列にしたい場合は Promise.allSettled か自前プール）
			for (const file of picked) {
				try {
					const presigned = await presignUpload(file.type);
					const res = await uploadToSignedUrl(presigned.url, file);
					if (!res.ok) throw new Error(`PUT failed: ${res.status}`);

					// UIへ即時反映（楽観反映）
					setFiles((current) => [toStorageItem(file, presigned), ...current]);

					// 完了通知（必要に応じて実データに合わせて）
					await uploadCompleat({
						key: presigned.key,
						mime: file.type || "application/octet-stream",
						bytes: file.size,
						sha256: "動作確認", // TODO: サーバで計算/検証するなら実値に
						exifHint: { taken_at: new Date().toISOString() },
					});
				} catch (e) {
					console.error("upload one failed:", file.name, e);
					// 1枚失敗しても他は続ける。全体フラグだけON
					setIsError(true);
					// 必要ならここで失敗ファイルをどこかに記録してUI表示も可
				}
			}
		} finally {
			setIsUploading(false);
		}
	};

	// ★ 後方互換：単一 input の onChange から複数処理へ委譲
	const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		// 連続選択用に即リセット（同じファイルを続けて選んでも発火するように）
		e.currentTarget.value = "";
		await handleSelectFiles(files ?? []);
	};

	// 単発アップロード関数が必要なら残せる（内部で複数APIを呼ぶだけ）
	const onUpload = async (file: File) => {
		await handleSelectFiles([file]);
	};

	return {
		isError,
		isUploading,
		handleSelectFile, // ← 既存のまま使える
		handleSelectFiles, // ← 新規（D&Dや複数 input からこれを使う）
		onUpload,
	};
};

export default useFileUpload;
