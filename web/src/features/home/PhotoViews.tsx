import type {
	ListPhotosResponse,
	PhotoItemType,
} from "@refeel/shared/photo.js";
import type {
	InfiniteData,
	UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import PhotoDetail from "./PhotoDetail";

type Props = {
	fetchPhotoQuery: UseInfiniteQueryResult<
		InfiniteData<ListPhotosResponse, unknown>,
		Error
	>;
};

export default function FileView({ fetchPhotoQuery }: Props) {
	console.log('FileView')

	const [selectedFile, setSelectedFile] = useState<PhotoItemType | null>(null)

	const files: PhotoItemType[] = useMemo(() => {
		const pages = fetchPhotoQuery.data?.pages ?? [];
		return pages.flatMap((p) => Object.values(p.grouped).flat());
	}, [fetchPhotoQuery.data]);


	return (
		<>
			{selectedFile && <PhotoDetail file={selectedFile} setSelectedFile={setSelectedFile} fetchPhotoQuery={fetchPhotoQuery} />}
			<div className="grid grid-flow-row lg:grid-cols-5 md:grid-cols-4 grid-cols-3 gap-1 mt-4">
				{files.map((file) => (
					<button
						key={file.id}
						type="button"
						className={`cursor-pointer`}
						onClick={() => setSelectedFile(file)}
					>
						<div className="relative aspect-square overflow-hidden bg-neutral-200">
							<img
								src={file.previewUrl ?? ""}
								alt={file.objectKey}
								className="absolute inset-0 h-full w-full object-cover"
								loading="lazy"
							/>
						</div>
					</button>
				))}
			</div>
		</>
	);
}
