// 署名URLへファイルをPUTするだけ（Content-Typeは必ず一致）
export async function uploadToSignedUrl(url: string, file: File) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
}
