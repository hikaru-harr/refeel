// src/features/photos/PhotoDetail.tsx
import { useEffect, useMemo, useState } from "react";
import type { ListPhotosResponse, PhotoItemType } from "@refeel/shared/photo.js";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Lightbox } from "./LightBox";

interface Props {
	file: PhotoItemType;
	close: () => void;
	refetch: UseInfiniteQueryResult<
		InfiniteData<ListPhotosResponse, unknown>,
		Error
	>["refetch"];
	getReadyUrl: (id: string) => string | null;
}

export default function PhotoDetail({ file, close, refetch, getReadyUrl }: Props) {
	const [hiresReady, setHiresReady] = useState(false);
	const [hiresUrl, setHiresUrl] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		const ready = getReadyUrl(file.id);
		const targetUrl = ready ?? (file.previewUrl ?? "");
		setHiresUrl(targetUrl);
		setHiresReady(!!ready);

		if (!ready && file.previewUrl) {
			const img = new Image();
			img.src = file.previewUrl;
			(img.decode?.() ?? Promise.resolve())
				.then(() => { if (!cancelled) { setHiresUrl(file.previewUrl!); setHiresReady(true); } })
				.catch(() => { /* サムネのままでもOK */ });
		}
		return () => { cancelled = true; };
	}, [file.id, file.previewUrl, getReadyUrl]);

	const dateLabel = useMemo(
		() => new Date(file.createdAt).toLocaleDateString(),
		[file.createdAt]
	);

	return (
		<Lightbox open onClose={close}>
			<div className="relative w-screen h-screen flex flex-col bg-white backdrop-blur-sm">
				{/* Header */}
				<div className="flex items-center gap-3 p-3">
					<button
						type="button"
						onClick={close}
						className="p-2 rounded hover:bg-white/10"
						aria-label="閉じる"
					>
						<ArrowLeft />
					</button>
					<div className="min-w-0">
						<div className="text-sm font-semibold">{dateLabel}</div>
						<div className="text-xs opacity-80 truncate">
							{file.mime}
							{file.width && file.height ? ` ・ ${file.width}×${file.height}` : ""}
						</div>
					</div>
				</div>

				{/* 画像：サムネ即表示→高解像度フェード */}
				<div className="relative flex-1 grid place-items-center px-4 pb-4 overflow-hidden">
					<img
						src={file.previewUrl ?? ""}
						alt="thumb"
						className="max-w-full max-h-full object-contain"
						style={{ filter: hiresReady ? "none" : "blur(2px)", opacity: hiresReady ? 0 : 1, transition: "opacity .18s" }}
						loading="eager"
						decoding="async"
						draggable={false}
					/>
					{hiresUrl && (
						<img
							src={hiresUrl}
							alt="preview"
							className="absolute inset-4 m-auto max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] object-contain"
							style={{ opacity: hiresReady ? 1 : 0, transition: "opacity .18s" }}
							loading="eager"
							decoding="async"
							fetchPriority="high"
							onError={() => refetch()}
							draggable={false}
						/>
					)}
				</div>
			</div>
		</Lightbox>
	);
}
