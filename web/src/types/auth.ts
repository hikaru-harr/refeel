// src/auth/ports.ts
export type AuthUser = {
	id: string;
	email?: string | null;
	displayName?: string | null;
	photoURL?: string | null;
};

export interface AuthPort {
	// 初回登録（メール/パスワード）
	signUpWithEmail(email: string, password: string): Promise<AuthUser>;

	// ログイン（メール/パスワード）
	signInWithEmail(email: string, password: string): Promise<AuthUser>;

	// ログアウト
	signOut(): Promise<void>;

	// 現在のユーザー取得（未ログインなら null）
	getCurrentUser(): Promise<AuthUser | null>;

	// アクセストークン/IDトークン取得（DRFに渡す用）
	getIdToken(forceRefresh?: boolean): Promise<string | null>;

	// 監視（ログイン状態変化を購読）
	onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
