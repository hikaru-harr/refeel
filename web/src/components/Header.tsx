import { Outlet } from "react-router";

function Header() {
	return (
		<>
			<header className="bg-violet-600 py-3">
				<p className="text-white text-2xl text-center font-bold">ReFeel</p>
			</header>
      <Outlet />
		</>
	);
}

export default Header;
