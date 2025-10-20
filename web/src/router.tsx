import { createBrowserRouter } from "react-router";
import Login from "./features/login/Login";
import PhotoUploader from "./features/photoUploader/PhotoUploader";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <PhotoUploader />,
	},
	{
		path: "/login",
		element: <Login />,
	},
]);
