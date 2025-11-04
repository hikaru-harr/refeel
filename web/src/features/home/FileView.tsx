import { ArrowLeft, MessageCircleMore, Send, Star, Tag } from "lucide-react";
import type { StorageItem } from "@/api/storage";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const buttonItems = [
	{
		icon: Tag,
		position: 80,
	},
	{
		icon: Star,
		position: 140,
	},
	{
		icon: MessageCircleMore,
		position: 200,
	},
];

interface Props {
	files: StorageItem[];
}

function FileView({ files }: Props) {
	return (
		<div className="grid grid-flow-row lg:grid-cols-5 md:grid-cols-4 grid-cols-3 gap-1 mt-4">
			{files.map((file, i) => (
				<Dialog key={file.key}>
					<DialogTrigger asChild>
						<button type="button" className="cursor-pointer">
							<div className="relative aspect-square overflow-hidden bg-neutral-200">
								<img
									src={file.previewUrl ?? ""}
									alt={`file-${i + 1}`}
									className="absolute inset-0 h-full w-full object-cover object-center"
									loading="lazy"
								/>
							</div>
						</button>
					</DialogTrigger>
					<DialogContent className="h-screen w-screen">
						<DialogHeader className="p-4">
							<DialogClose
								data-slot="dialog-close"
								className="absolute top-6 left-6 cursor-pointer ring-offset-background focus:ring-ring-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6"
							>
								<ArrowLeft />
							</DialogClose>
							<DialogTitle>Edit profile</DialogTitle>
							<DialogDescription>date</DialogDescription>
						</DialogHeader>
						<div className="relative flex-1 overflow-hidden grid place-items-center px-4">
							<img
								src={file.previewUrl ?? ""}
								alt="preview"
								className="max-w-[calc(100vw-2rem)] max-h-[calc(100svh-8rem)] object-contain"
							/>
						</div>
						<DialogFooter className="p-4 flex items-end">
							<div className="relative w-full">
								<div className="flex">
									<Input type="text" placeholder="コメントを追加" />
									<Button size="icon">
										<Send />
									</Button>
								</div>
								{buttonItems.map((item) => {
									const Icon = item.icon;
									return (
										<button
											key={item.toString()}
											type="button"
											className={`absolute cursor-pointer bg-violet-600 text-white top-[-${item.position}px] right-4 bg-red-200 rounded-full w-12 h-12 flex justify-center items-center`}
										>
											<Icon />
										</button>
									);
								})}
							</div>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			))}
		</div>
	);
}

export default FileView;
