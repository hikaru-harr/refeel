import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./provider/AuthProvider";
import { router } from "./router";

const queryClient = new QueryClient();

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<RouterProvider router={router} />
				</AuthProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
}
