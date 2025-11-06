import { useEffect, useState } from "react";
import { fetchPhotos, type PhotoItem } from "@/api/photos";
import { getUploadFile, type StorageItem } from "@/api/storage";
import FileUploadArea from "./FileUploadArea";
import FileView from "./FileView";

function Home() {
	const [files, setFiles] = useState<PhotoItem[]>([]);

	useEffect(() => {
		const init = async () => {
			const response = await fetchPhotos({cursor: ""});
			setFiles(response.items);
		};
		init();
	}, []);
	return (
		<div>
			<FileUploadArea setFiles={setFiles} />
			<FileView files={files} />
		</div>
	);
}

export default Home;
