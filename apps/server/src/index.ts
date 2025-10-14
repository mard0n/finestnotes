import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
import image from "./routes/image";
import page from "./routes/page";
import highlight from "./routes/highlight";
import articles from "./routes/articles";
import { auth } from "./utils/auth";
import { logger } from "hono/logger";
import type { Session, User } from "better-auth";

export type Bindings = {
  finestdb: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NODE_ENV: 'development' | 'production';
};

const app = new Hono<{
  Bindings: Bindings, Variables: {
    user: User | null;
    session: Session | null;
  }
}>()

app.use(logger())

// CORS configuration for cross-origin cookies
app.use(
  "/api/auth/*", // or replace with "*" to enable cors for all routes
  cors({
    origin: (origin, c) => {
      const isDev = c.env.NODE_ENV !== 'production';

      if (isDev) {
        // In development, allow localhost on any port
        if (origin && origin.startsWith('http://localhost:')) {
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
  }),
);

app.on(['GET', 'POST'], '/api/auth/*', async (c) => {  
  console.log('Request:', c.req);
  const res = await auth(c.env).handler(c.req.raw);
  console.log('/api/auth res', res);
  return res;
});

app.use("/api/*", async (c, next) => {
  const session = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  console.log('Auth session:', session);
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

const routes = app
  .route("/api/articles", articles)
  .route("/api/page", page)
  .route("/api/highlight", highlight)
  .route("/api/image", image)

export type RouteType = typeof routes

export default app;

