import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "./db/schema";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";

type Bindings = {
  finest_db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api/")

let route = app.get("/notes", async (c) => {
  const db = drizzle(c.env.finest_db);
  const result = await db.select().from(notes).all();
  return c.json(result);
}).post(
  "/note",
  zValidator(
    "json",
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    })
  ),
  async (c) => {
    const { title, content } = c.req.valid("json");
    const db = drizzle(c.env.finest_db);

    await db.insert(notes).values({ title, content }).run();

    return c.json({
      success: true,
      message: `Note is successfully added`,
    });
  }
);

export type route = typeof route;

export default app;