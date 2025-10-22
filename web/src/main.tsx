import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./provider/AuthProvider";
import { router } from "./router";

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(
		<StrictMode>
			<AuthProvider>
				<RouterProvider router={router} />
			</AuthProvider>
		</StrictMode>,
	);
}
