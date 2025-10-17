import { useState } from "react";
import { presignDownload, presignUpload } from "../../api/storage";
import { uploadToSignedUrl } from "../../lib/upload";

export default function PhotoUploader() {
	const [file, setFile] = useState<File | null>(null);
	const [key, setKey] = useState<string | null>(null);
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
	const [status, setStatus] = useState<
		"idle" | "signing" | "uploading" | "done" | "error"
	>("idle");
	const [err, setErr] = useState<string | null>(null);

	async function handleUpload() {
		try {
			setErr(null);
			if (!file) throw new Error("ファイルを選んでください");
			// 1) 署名URL発行
			setStatus("signing");
			const { url, key } = await presignUpload(file.type);
			setKey(key);
			// 2) 直PUT
			setStatus("uploading");
			await uploadToSignedUrl(url, file);
			// 3) ダウンロードURL（確認用）
			const d = await presignDownload(key);
			setDownloadUrl(d.url);
			setStatus("done");
		} catch (e: any) {
			setErr(e?.message ?? String(e));
			setStatus("error");
		}
	}

	return (
		<div
			style={{
				border: "1px solid #ddd",
				padding: 16,
				borderRadius: 8,
				maxWidth: 520,
			}}
		>
			<h3>写真アップロード（MinIO 直PUT）</h3>
			<input
				type="file"
				accept="image/*"
				onChange={(e) => setFile(e.target.files?.[0] ?? null)}
				style={{ marginTop: 8, marginBottom: 12 }}
			/>
			<div>
				<button
					onClick={handleUpload}
					disabled={!file || status === "signing" || status === "uploading"}
				>
					{status === "signing"
						? "署名URL発行中..."
						: status === "uploading"
							? "アップロード中..."
							: "アップロード"}
				</button>
			</div>

			{err && <p style={{ color: "crimson" }}>エラー: {err}</p>}
			{key && (
				<p style={{ fontFamily: "monospace", fontSize: 12 }}>key: {key}</p>
			)}
			{downloadUrl && (
				<p>
					ダウンロードURL:{" "}
					<a href={downloadUrl} target="_blank" rel="noreferrer">
						開く
					</a>
				</p>
			)}
			{status === "done" && (
				<p style={{ color: "green" }}>アップロード完了！</p>
			)}
		</div>
	);
}
