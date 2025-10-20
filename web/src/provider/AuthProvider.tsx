// src/auth/AuthProvider.tsx

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createAuth } from "@/lib/auth";
import type { AuthPort, AuthUser } from "@/types/auth";

type AuthContextValue = {
	user: AuthUser | null;
	loading: boolean;
	auth: AuthPort;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const auth = useMemo(() => createAuth(), []);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// 初期化 & 購読
		const unsub = auth.onAuthStateChanged(async (u) => {
			setUser(u);
			setLoading(false);
		});
		return () => unsub?.();
	}, [auth]);

	return (
		<AuthContext.Provider value={{ user, loading, auth }}>
			{children}
		</AuthContext.Provider>
	);
};

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
	return ctx;
}
