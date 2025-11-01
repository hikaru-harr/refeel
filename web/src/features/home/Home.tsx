import { useEffect, useState } from "react";
import { getUploadFile, type StorageItem } from "@/api/storage";
import FileUploadArea from "./FileUploadArea";
import FileView from "./FileView";

function Home() {
	const [files, setFiles] = useState<StorageItem[]>([]);

	useEffect(() => {
		const init = async () => {
			const response = await getUploadFile();
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
