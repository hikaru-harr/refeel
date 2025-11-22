import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"border-input h-12 w-full min-w-0 rounded-md border border-vioret-600 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
				"focus:border-violet-600",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
				"placeholder:text-muted-foreground",
				"selection:bg-primary selection:text-primary-foreground",
				"md:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
