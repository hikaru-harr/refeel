import FileUploadArea from "./FileUploadArea";
import FileView from "./PhotoViews";
import useInfiniteScroll from "./useInfiniteScroll";

function Home() {
	const { sentinelRef, fetchPhotoQuery } = useInfiniteScroll()

	return (
		<div>
			<FileUploadArea />
			<FileView fetchPhotoQuery={fetchPhotoQuery} />
			<div ref={sentinelRef} className="h-10" />
		</div>
	);
}

export default Home;
