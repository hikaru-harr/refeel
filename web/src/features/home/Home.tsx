// Home.tsx
import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPhotos, type PhotoItem, type ListPhotosResponse } from "@/api/photos";
import FileUploadArea from "./FileUploadArea";
import FileView from "./FileView";

function Home() {
	// 無限ページング
	const query = useInfiniteQuery<ListPhotosResponse>({
		queryKey: ["photos", { group: "ymd", take: 50 }],
		queryFn: ({ pageParam }) => fetchPhotos({ group: "ym", take: 50, cursor: pageParam }),
		getNextPageParam: (last) => last.nextCursor ?? undefined,
		staleTime: 30_000,
	});

	// grouped をフラットに
	const files: PhotoItem[] = useMemo(() => {
		const pages = query.data?.pages ?? [];
		return pages.flatMap((p) => Object.values(p.grouped).flat());
	}, [query.data]);

	// 下端で追加読み込み（お好みで）
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!sentinelRef.current) return;
		const io = new IntersectionObserver((ents) => {
			if (ents[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
				query.fetchNextPage();
			}
		});
		io.observe(sentinelRef.current);
		return () => io.disconnect();
	}, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

	return (
		<div>
			{/* アップロード完了時は invalidate して再取得 */}
			<FileUploadArea
				setFiles={() => query.refetch()}
			/>
			<FileView
				files={files}
				onImgExpireRefetch={() => query.refetch()}
			/>
			<div ref={sentinelRef} className="h-10" />
		</div>
	);
}

export default Home;
