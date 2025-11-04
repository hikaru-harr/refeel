import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { useAuth } from "./middlewares/auth.js";
import { storage } from "./routers/storage.js";

const app = new Hono();

// CORS（フロントだけ許可）
app.use(
	"*",
	cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }),
);
app.use("*", useAuth);
app.get("/", (c) => c.text("Hello Hono!"));
app.get("/health", (c) => c.json({ ok: true }));
app.route("/storage", storage);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`);
});
