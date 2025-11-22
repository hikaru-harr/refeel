// src/features/photos/FileView.tsx
import type { ListPhotosResponse, PhotoItemType } from "@refeel/shared/photo.js";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useState, useTransition } from "react";
import PhotoDetail from "./PhotoDetail";
import { useImagePrefetch } from "./useImagePrefetch";
import { VirtualPhotoGrid } from "./VirtualPhotoGrid";

type Props = {
	fetchPhotoQuery: UseInfiniteQueryResult<
		InfiniteData<ListPhotosResponse, unknown>,
		Error
	>;
};

export default function FileView({ fetchPhotoQuery }: Props) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const { prefetch, getReadyUrl } = useImagePrefetch();

	const pages = fetchPhotoQuery.data?.pages ?? [];
	const files: PhotoItemType[] = useMemo(
		() => pages.flatMap((p) => Object.values(p.grouped).flat()),
		[pages]
	);

	const filesMap = useMemo(() => {
		const m = new Map<string, PhotoItemType>();
		for (const f of files) m.set(f.id, f);
		return m;
	}, [files]);

	const handleOpen = useCallback((id: string) => {
		startTransition(() => setSelectedId(id));
	}, []);
	const handleClose = useCallback(() => setSelectedId(null), []);

	const selectedFile = selectedId ? filesMap.get(selectedId) ?? null : null;

	return (
		<>
			{selectedFile && (
				<PhotoDetail
					file={selectedFile}
					close={handleClose}
					refetch={fetchPhotoQuery.refetch}
					getReadyUrl={getReadyUrl}
				/>
			)}

			<VirtualPhotoGrid files={files} onOpen={handleOpen} prefetch={prefetch} />
		</>
	);
}
