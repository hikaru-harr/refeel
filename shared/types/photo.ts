export type PhotoItemType = {
	id: string;
	objectKey: string;
	mime: string | null;
	bytes: number | null;
	createdAt: string;
	width: number | null;
	height: number | null;
	exifJson: Record<string, unknown> | null;
	status: string;
	previewUrl: string | null;
	favoriteCount: number;
	commentCount: number;
	isFavorited: boolean;
};

export type PhotoComment = {
	id: string;
	photoId: string;
	userId: string;
	body: string;
	createdAt: string;
	updatedAt?: string;
};

export type ListCommentsResponse = {
	items: PhotoComment[];
};

export type ListPhotosResponse = {
	grouped: Record<string, PhotoItemType[]>;
	nextCursor: string | null;
};
