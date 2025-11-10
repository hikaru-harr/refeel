import "dotenv/config";
import {
	applicationDefault,
	cert,
	getApp,
	getApps,
	initializeApp,
} from "firebase-admin/app";

const hasInline = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

export const app = getApps().length
	? getApp()
	: initializeApp({
			credential: hasInline
				? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!))
				: applicationDefault(),
			projectId: process.env.FIREBASE_PROJECT_ID,
		});
