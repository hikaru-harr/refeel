// FileUploadArea.tsx
import { LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFileUpload from "./useFileUpload";

/**
 * 画像アップロード UI
 * - クリックでファイル選択
 * - ドラッグ＆ドロップ対応（複数可）
 * - アップロード中はボタンを無効化＆スピナー表示
 * - キーボード操作（Enter/Space）にも対応
 */
function FileUploadArea() {
	// 隠し <input type="file"> への参照（クリックで開くため）
	const inputRef = useRef<HTMLInputElement | null>(null);

	// アップロード処理ロジックはカスタムフックに委譲
	// - handleSelectFiles(FileList): 選択/ドロップされたファイルを処理
	// - isUploading: アップロード中フラグ（UI をローディング状態に）
	// - isError: 簡易的なエラーフラグ（例：ファイル未選択）
	const { handleSelectFiles, isError, isUploading } = useFileUpload();

	// ドラッグ中の見た目切り替え用フラグ
	const [isDragOver, setIsDragOver] = useState(false);

	return (
		<div
			// --- D&D（ドラッグオーバー中の見た目切り替え） ---
			onDragOver={(e) => {
				e.preventDefault(); // 既定の「ファイルを開く」動作を抑止
				setIsDragOver(true);
			}}
			onDragLeave={() => setIsDragOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setIsDragOver(false);
				// DataTransfer からファイルを受け取り、フックに渡す
				if (e.dataTransfer.files?.length) {
					handleSelectFiles(e.dataTransfer.files);
				}
			}}
			// --- 見た目（ドラッグ中に色が変わる） ---
			className={[
				"mt-6 rounded-2xl border-2 border-dashed",
				"p-6 text-center transition-colors",
				isDragOver ? "bg-muted/60 border-primary" : "bg-transparent",
			].join(" ")}
			// --- クリック/キーボードでも操作できるようにボタンロール付与 ---
			role="button"
			tabIndex={0}
			onClick={() => inputRef.current?.click()} // クリックで隠し input を開く
			onKeyDown={(e) => {
				// Enter/Space でもファイルダイアログを開く（アクセシビリティ対応）
				if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
			}}
			aria-label="画像をドラッグ＆ドロップ、またはクリックして選択"
		>
			<div className="flex justify-center">
				{/* 表に見える “アップロード” ボタン（実体は隠し input を叩く） */}
				<Button
					disabled={isUploading} // アップロード中は押せない
					onClick={(e) => {
						e.stopPropagation(); // 親の onClick に伝播させない
						inputRef.current?.click();
					}}
					className="h-12 rounded-full w-[250px] cursor-pointer"
				>
					{/* アップロード中はスピナー、それ以外はアイコン */}
					{isUploading ? <LoaderCircle className="animate-spin" /> : <Upload />}
					写真をアップロード
				</Button>

				{/* 実際にファイルを選ぶ <input type="file"> は非表示にして、ref で操作 */}
				<Input
					ref={inputRef}
					onChange={(e) => {
						const files = e.target.files;
						if (files?.length) {
							handleSelectFiles(files); // 選択されたファイルをアップロード処理へ
							e.currentTarget.value = ""; // 同じファイルを連続選択できるようにクリア
						}
					}}
					type="file"
					className="hidden" // 見せない（代わりにボタンでトリガ）
					multiple // 複数選択許可
					accept="image/*" // 画像のみ。将来動画も載せるなら "image/*,video/*"
				/>
			</div>

			{/* 補助テキスト（D&D 対応の案内） */}
			<p className="mt-3 text-sm text-muted-foreground">
				ここにドラッグ＆ドロップもできます（複数可）
			</p>

			{/* 簡易エラー表示（useFileUpload 側の状態をそのまま表示） */}
			{isError && (
				<p className="text-red-400 text-center mt-2">ファイルを選択してください</p>
			)}
		</div>
	);
}

export default FileUploadArea;
