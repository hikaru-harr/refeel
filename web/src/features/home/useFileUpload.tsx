// hooks/useFileUpload.ts

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { PhotoItem } from "@/api/photos";
import {
	type PresignUploadRes,
	presignUpload,
	uploadCompleat,
} from "@/api/storage";
import { uploadToSignedUrl } from "@/lib/upload";

// クエリキーのセカンド要素に { group, take, presign, ttl } を入れている前提
type PhotosKeyParam = {
	group?: "ymd" | "ym" | "all";
	take?: number;
	presign?: boolean;
	ttl?: number;
};

export default function useFileUpload() {
	const qc = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);
	const [isError, setIsError] = useState(false);

	const computeGroupKey = (
		group: PhotosKeyParam["group"],
		createdAtISO: string,
	) => {
		if (group === "all") return "all";
		const d = new Date(createdAtISO);
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		if (group === "ym") return `${y}-${m}`;
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`; // default: ymd
	};

	const optimisticInsert = (created: PhotoItem) => {
		// すべての "photos" キャッシュに対して反映
		const entries = qc.getQueriesData<any>({ queryKey: ["photos"] });
		let touched = false;

		for (const [key, old] of entries) {
			if (!old) continue;

			// key は ["photos", { group: "ymd", ... }] の想定
			const params = (Array.isArray(key) ? key[1] : undefined) as
				| PhotosKeyParam
				| undefined;
			const group = params?.group ?? "ymd";
			const gk = computeGroupKey(group, created.createdAt);

			const draft = structuredClone(old); // { pages, pageParams }
			if (!draft.pages?.length) {
				// ページがない場合はスキップ（後で invalidate）
				continue;
			}

			const first = draft.pages[0];
			if (!first.grouped) first.grouped = {};
			if (!Array.isArray(first.grouped[gk])) first.grouped[gk] = [];
			// 重複チェック（念のため）
			if (!first.grouped[gk].some((it: PhotoItem) => it.id === created.id)) {
				first.grouped[gk].unshift(created);
				qc.setQueryData(key, draft);
				touched = true;
			}
		}

		return touched;
	};

	const handleSelectFiles = async (files: FileList | File[]) => {
		const picked = Array.from(files ?? []).filter(Boolean) as File[];
		if (picked.length === 0) {
			setIsError(true);
			return;
		}

		setIsUploading(true);
		setIsError(false);

		try {
			for (const file of picked) {
				try {
					// 1) 署名URL取得
					const presigned: PresignUploadRes = await presignUpload(file.type);

					// 2) PUT でオブジェクトアップロード
					const res = await uploadToSignedUrl(presigned.url, file);
					if (!res.ok) throw new Error(`PUT failed: ${res.status}`);

					// 3) 完了通知 → サーバが完全 PhotoItem を返す
					const { item }: { item: PhotoItem } = await uploadCompleat({
						key: presigned.key,
						mime: file.type || "application/octet-stream",
						bytes: file.size,
						exifHint: { taken_at: new Date().toISOString() },
					});

					// 4) 即時挿入（キャッシュがあれば）
					const updated = optimisticInsert(item);
					if (!updated) {
						// キャッシュがまだない場合は後で invalidate されるのでOK
					}
				} catch (e) {
					console.error("upload one failed:", file.name, e);
					setIsError(true);
					// 他ファイルは続行
				}
			}
		} finally {
			setIsUploading(false);
			// 5) 最終整合（TTL/グループ跨ぎ/別タブ等もカバー）
			qc.invalidateQueries({ queryKey: ["photos"] });
		}
	};

	const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		e.currentTarget.value = "";
		await handleSelectFiles(files ?? []);
	};

	const onUpload = async (file: File) => {
		await handleSelectFiles([file]);
	};

	return {
		isUploading,
		isError,
		handleSelectFiles,
		handleSelectFile,
		onUpload,
	};
}
