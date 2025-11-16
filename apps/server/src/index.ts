import { Hono } from "hono";
import notesRoute from "./routes/notes";
import pagesRoute from "./routes/pages";

const app = new Hono().basePath("/api");

const routes = app.route("/notes", notesRoute).route("/pages", pagesRoute);

export type RouteType = typeof routes;

export default app;
