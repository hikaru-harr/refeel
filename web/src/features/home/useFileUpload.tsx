import type React from "react";
import { useRef, useState } from "react";

const useFileUpload = () => {
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [isError, setIsError] = useState(false);

	const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		console.log(selectedFile);

		if (!selectedFile) {
			setIsError(true);
			return;
		}

		onUpload(selectedFile);
	};

	const onUpload = (file: File) => {
		console.log(file);
	};

	// const handleUpload = async () => {
	// 	if (!file) return;
	// 	try {
	// 		setIsUploading(true);
	// 		await onUpload(file);
	// 		reset();
	// 	} finally {
	// 		setIsUploading(false);
	// 	}
	// };
	return {
		isError,
		handleSelectFile,
	};
};

export default useFileUpload;
