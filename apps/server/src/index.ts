import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
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

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const isDev = c.env.NODE_ENV !== "production";
      const allowedOrigins = [
        "https://finestnotes.com",
        "https://www.finestnotes.com",
        "chrome-extension://gnoknopednpdpmkemfmhanmpgmfnfhho",
      ];

      console.log('=== CORS DEBUG ===');
      console.log('origin parameter:', origin);
      console.log('NODE_ENV:', c.env.NODE_ENV);
      console.log('All headers:', Object.fromEntries(c.req.raw.headers));
      console.log('==================');

      if (isDev && origin?.startsWith("http://localhost:")) {
        return origin;
      }

      if (origin && allowedOrigins.includes(origin)) {
        return origin;
      }

       // TODO: Refine origins later. Cloudflare removing origin.
      // const origin =
      //   origin || c.req.header("Origin") || c.req.header("cf-worker");

      // console.log("c.req.header()", c.req.header());
      // console.log("origin", origin);
      // console.log("origin", origin);
      // console.log(
      //   "allowedOrigins.includes(origin)",
      //   allowedOrigins.includes(origin ?? "")
      // );

      // if (origin && allowedOrigins.includes(origin)) {
      //   return 'https://finestnotes.com';
      // }

      return 'https://finestnotes.com';
    },
    allowHeaders: ["Origin", "Content-Type", "Authorization"],
    allowMethods: ["OPTIONS", "GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 600,
  })
);

app.on(
  ["GET", "POST"],
  "/api/auth/*",
  async (c) => await auth(c.env).handler(c.req.raw)
);

const routes = app
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
