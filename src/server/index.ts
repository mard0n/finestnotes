import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import notesRoute from "./api/routes/notes";
import { auth } from "./auth";
import { logger } from "hono/logger";

export type Bindings = {
  finestdb: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.use(logger())

app.on(["GET", "POST"], "/auth/*", async (c) => {
  return await auth(c.env).handler(c.req.raw);
});

const routes = app.route("/notes", notesRoute);

export type RouteType = typeof routes;

export { app };
