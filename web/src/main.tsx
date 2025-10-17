import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import PhotoUploader from "./features/photoUploader/PhotoUploader";

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(
		<StrictMode>
			<PhotoUploader />
		</StrictMode>,
	);
}
