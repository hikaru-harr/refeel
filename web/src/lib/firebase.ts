import { getApps, initializeApp } from "firebase/app";
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged as fbOnAuthStateChanged,
	signOut as fbSignOut,
	getAuth,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	type User,
} from "firebase/auth";
import type { AuthPort, AuthUser } from "@/types/auth";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_API_KEY,
	authDomain: import.meta.env.VITE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_APP_ID,
};

export const app = getApps().length
	? getApps()[0]
	: initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 初期化完了を待つ（currentUser が決まるまで待機）
export function waitAuthReady(): Promise<User | null> {
	return new Promise((resolve) => {
		const off = onAuthStateChanged(auth, (u) => {
			off();
			resolve(u);
		});
	});
}
function toAuthUser(u: User): AuthUser {
	return {
		id: u.uid,
		email: u.email,
		displayName: u.displayName,
		photoURL: u.photoURL ?? undefined,
	};
}

export class FirebaseAuthAdapter implements AuthPort {
  // auth は外の単一インスタンスを使う
  async signUpWithEmail(email: string, password: string): Promise<AuthUser> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return toAuthUser(cred.user);
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(cred.user);
  }

  async signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const u = auth.currentUser ?? (await waitAuthReady());
    return u ? toAuthUser(u) : null;
  }

  // ★ 初期化完了を待ってから token を取得
  async getIdToken(forceRefresh = false): Promise<string | null> {
    const u = auth.currentUser ?? (await waitAuthReady());
    if (!u) return null;
    return u.getIdToken(forceRefresh);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return fbOnAuthStateChanged(auth, (u) => callback(u ? toAuthUser(u) : null));
  }
}