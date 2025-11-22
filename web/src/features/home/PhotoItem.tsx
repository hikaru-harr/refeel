// PhotoItem.tsx

import type {
	ListPhotosResponse,
	PhotoItemType,
} from "@refeel/shared/photo.js";
import type {
	InfiniteData,
	UseInfiniteQueryResult,
} from "@tanstack/react-query";
import type React from "react";
import { forwardRef, useRef } from "react";

type Props = {
	file: PhotoItemType;
	fetchPhotoQuery: UseInfiniteQueryResult<
		InfiniteData<ListPhotosResponse, unknown>,
		Error
	>;
} & React.ComponentPropsWithoutRef<"button">; // ← asChild が渡す onClick/ref などを受け取る

const PhotoItem = forwardRef<HTMLButtonElement, Props>(
	({ file, fetchPhotoQuery, className, ...props }, ref) => {
		const retriedRef = useRef(false);

		const handleImgError: React.ReactEventHandler<HTMLImageElement> = () => {
			if (retriedRef.current) return;
			retriedRef.current = true;
			fetchPhotoQuery.refetch();
		};

		return (
			<button
				ref={ref}
				type="button"
				className={`cursor-pointer ${className ?? ""}`}
				{...props} // ← onClick, data-state などを必ず渡す！
			>
				<div className="relative aspect-square overflow-hidden bg-neutral-200">
					<img
						src={file.previewUrl ?? ""}
						alt={file.objectKey}
						className="absolute inset-0 h-full w-full object-cover"
						loading="lazy"
						onError={handleImgError}
					/>
				</div>
			</button>
		);
	},
);

PhotoItem.displayName = "PhotoItem";
export default PhotoItem;
