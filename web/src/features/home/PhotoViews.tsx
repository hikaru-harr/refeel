import { useMemo } from "react";

import type { ListPhotosResponse, PhotoItemType } from "@refeel/shared/photo.js";
import PhotoDetail from "./PhotoDetail";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";

type Props = {
	fetchPhotoQuery: UseInfiniteQueryResult<InfiniteData<ListPhotosResponse, unknown>, Error>
};

export default function FileView({ fetchPhotoQuery }: Props) {
	const files: PhotoItemType[] = useMemo(() => {
		const pages = fetchPhotoQuery.data?.pages ?? [];
		return pages.flatMap((p) => Object.values(p.grouped).flat());
	}, [fetchPhotoQuery.data]);

	return (
		<div className="grid grid-flow-row lg:grid-cols-5 md:grid-cols-4 grid-cols-3 gap-1 mt-4">
			{files.map((file) => (
				<PhotoDetail key={file.id} file={file} fetchPhotoQuery={fetchPhotoQuery} />
			))}
		</div>
	);
}
