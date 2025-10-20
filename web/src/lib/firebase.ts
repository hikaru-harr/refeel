import { getApps, initializeApp } from "firebase/app";
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged as fbOnAuthStateChanged,
	signOut as fbSignOut,
	getAuth,
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

export const app = initializeApp(firebaseConfig);

function toAuthUser(u: User): AuthUser {
	return {
		id: u.uid,
		email: u.email,
		displayName: u.displayName,
		photoURL: u.photoURL ?? undefined,
	};
}

export class FirebaseAuthAdapter implements AuthPort {
	private auth = getAuth();

	constructor() {
		if (!getApps().length) {
			initializeApp(firebaseConfig);
		}
	}

	async signUpWithEmail(email: string, password: string): Promise<AuthUser> {
		const cred = await createUserWithEmailAndPassword(
			this.auth,
			email,
			password,
		);
		return toAuthUser(cred.user);
	}

	async signInWithEmail(email: string, password: string): Promise<AuthUser> {
		const cred = await signInWithEmailAndPassword(this.auth, email, password);
		return toAuthUser(cred.user);
	}

	async signOut(): Promise<void> {
		await fbSignOut(this.auth);
	}

	async getCurrentUser(): Promise<AuthUser | null> {
		const u = this.auth.currentUser;
		return u ? toAuthUser(u) : null;
	}

	async getIdToken(forceRefresh = false): Promise<string | null> {
		const u = this.auth.currentUser;
		if (!u) return null;
		return u.getIdToken(forceRefresh);
	}

	onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
		return fbOnAuthStateChanged(this.auth, (u) =>
			callback(u ? toAuthUser(u) : null),
		);
	}
}
