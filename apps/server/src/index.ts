import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
import articles from "./routes/articles";
import note from "./routes/note";
import page from "./routes/page";
import image from "./routes/image";
import highlight from "./routes/highlight";
import projectRoutes from "./routes/projects";
import search from "./routes/search";
import userRoutes from "./routes/user";
import settingsRoutes from "./routes/settings";
import commentsRouter from "./routes/comments";
import { auth } from "./utils/auth";
import { logger } from "hono/logger";

export type Bindings = {
  finestdb: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NODE_ENV: "development" | "production";
};

const app = new Hono<{
  Bindings: Bindings;
}>();

app.use(logger());

// CORS configuration for cross-origin cookies
app.use(
  "/api/auth/*", // or replace with "*" to enable cors for all routes
  cors({
    origin: (origin, c) => {
      const isDev = c.env.NODE_ENV !== "production";

      if (isDev) {
        // In development, allow localhost on any port
        if (origin && origin.startsWith("http://localhost:")) {
          return origin;
        }
      }

      return null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  // console.log('/api/auth/* req:', c.req);
  const res = await auth(c.env).handler(c.req.raw);
  // console.log('/api/auth/* res:', res);
  return res;
});

const routes = app
  .route("/api/articles", articles)
  .route("/api/note", note)
  .route("/api/page", page)
  .route("/api/highlight", highlight)
  .route("/api/image", image)
  .route("/api/projects", projectRoutes)
  .route("/api/search", search)
  .route("/api/user", userRoutes)
  .route("/api/settings", settingsRoutes)
  .route("/api/comments", commentsRouter);

export type RouteType = typeof routes;

export default app;
