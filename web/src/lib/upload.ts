// 署名URLへファイルをPUTするだけ（Content-Typeは必ず一致）
export async function uploadToSignedUrl(url: string, file: File) {
	const result = await fetch(url, {
		method: "PUT",
		headers: { "content-type": file.type },
		body: file,
	});
	return result;
}
