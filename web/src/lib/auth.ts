import type { AuthPort } from "@/types/auth";
import { FirebaseAuthAdapter } from "./firebase";

export function createAuth(): AuthPort {
	const provider = (
		import.meta.env.VITE_AUTH_PROVIDER ?? "firebase"
	).toLowerCase();

	switch (provider) {
		case "firebase":
			return new FirebaseAuthAdapter();
		default:
			throw new Error(`Unsupported VITE_AUTH_PROVIDER: ${provider}`);
	}
}
