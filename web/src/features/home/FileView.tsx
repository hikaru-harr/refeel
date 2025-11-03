import type { StorageItem } from "@/api/storage";

interface Props {
	files: StorageItem[];
}

function FileView({ files }: Props) {
	return (
		<div className="grid grid-flow-row lg:grid-cols-5 md:grid-cols-4 grid-cols-3 gap-1 mt-4">
			{files.map((file, i) => (
				<div
					key={file.key}
					className="relative aspect-square overflow-hidden bg-neutral-200"
				>
					<img
						src={file.previewUrl ?? ""}
						alt={`file-${i + 1}`}
						className="absolute inset-0 h-full w-full object-cover object-center"
						loading="lazy"
					/>
				</div>
			))}
		</div>
	);
}

export default FileView;
