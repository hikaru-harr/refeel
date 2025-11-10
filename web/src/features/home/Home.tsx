// Home.tsx
import { useMemo } from "react";
import FileUploadArea from "./FileUploadArea";
import FileView from "./FileView";
import useInfiniteScroll from "./useInfiniteScroll";
import type { PhotoItem } from "@refeel/shared/photo.js";

function Home() {
	const { sentinelRef, fetchPhotoQuery } = useInfiniteScroll()

	const files: PhotoItem[] = useMemo(() => {
		const pages = fetchPhotoQuery.data?.pages ?? [];
		return pages.flatMap((p) => Object.values(p.grouped).flat());
	}, [fetchPhotoQuery.data]);

	return (
		<div>
			<FileUploadArea />
			<FileView
				files={files}
				onImgExpireRefetch={() => fetchPhotoQuery.refetch()}
			/>
			<div ref={sentinelRef} className="h-10" />
		</div>
	);
}

export default Home;
