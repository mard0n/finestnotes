import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { cors } from "hono/cors";
import image from "./routes/image";
import page from "./routes/page";
import highlight from "./routes/highlight";

export type Bindings = {
  finestdb: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api")

app.use(cors());

const routes = app
  .route("/highlight", highlight)
  .route("/page", page)
  .route("/image", image);

export type RouteType = typeof routes

export default app;

