import { createBrowserRouter } from "react-router";
import Header from "./components/Header";
import Home from "./features/home/Home";
import Login from "./features/login/Login";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <Header />,
		children: [
			{
				index: true,
				element: <Home />,
			},
		],
	},
	{
		path: "/login",
		element: <Login />,
	},
]);
