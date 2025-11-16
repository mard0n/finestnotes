import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import notesRoute from "./routes/notes";

export type Bindings = {
  finestdb: D1Database;
};

const app = new Hono().basePath("/api");

const routes = app.route("/notes", notesRoute)

export type RouteType = typeof routes;

export { app };