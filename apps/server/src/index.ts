import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { cors } from "hono/cors";
import image from "./routes/image";
import page from "./routes/page";
import highlight from "./routes/highlight";
import articles from "./routes/articles";
import { auth } from "./utils/auth";

export type Bindings = {
  finestdb: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api")

app.use(cors());

// app.on(['GET', 'POST'], '/*', (c) => {
//   console.log('Request:', c.req.method, c.req.url);
//   return auth(c.env).handler(c.req.raw);
// });

const routes = app
  .route("/articles", articles)
  .route("/page", page)
  .route("/highlight", highlight)
  .route("/image", image)

export type RouteType = typeof routes

export default app;

