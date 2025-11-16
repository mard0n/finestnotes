import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "./auth";
import { logger } from "hono/logger";
import notes from "./api/routes/notes";
import page from "./api/routes/page";
import image from "./api/routes/image";
import highlight from "./api/routes/highlight";
import projectRoutes from "./api/routes/projects";
import search from "./api/routes/search";
import userRoutes from "./api/routes/user";
import settingsRoutes from "./api/routes/settings";
import commentsRouter from "./api/routes/comments";

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

const routes = app
  .route("/notes", notes)
  .route("/page", page)
  .route("/highlight", highlight)
  .route("/image", image)
  .route("/projects", projectRoutes)
  .route("/search", search)
  .route("/user", userRoutes)
  .route("/settings", settingsRoutes)
  .route("/comments", commentsRouter);

export type RouteType = typeof routes;

export { app };
