import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { annotations, notes } from "./db/schema";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { cors } from "hono/cors";
import { eq } from "drizzle-orm";

type Bindings = {
  finestdb: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api/")

app.use(cors());

let route = app.get("/notes", async (c) => {
  const db = drizzle(c.env.finestdb);
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
    const db = drizzle(c.env.finestdb);

    await db.insert(notes).values({ title, content }).run();

    return c.json({
      success: true,
      message: `Note is successfully added`,
    });
  }
).post("/highlight",
  zValidator(
    "json",
    z.object({
      sourceTitle: z.string().min(1),
      sourceLink: z.url(),
      content: z.string(),
      link: z.url(),
      comment: z.string().optional(),
    })
  ),
  async (c) => {
    const { sourceTitle, sourceLink, content, link, comment } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);

    const [highlight] = await db.insert(annotations).values({ type: "highlight", sourceTitle, sourceLink, content, link, comment }).returning()

    return c.json(highlight);
  }
).delete("/highlight/:id", zValidator('param', z.object({
  id: z.string()
})), async (c) => {
  const { id } = c.req.valid("param")
  const db = drizzle(c.env.finestdb);

  await db.delete(annotations).where(eq(annotations.id, Number(id))).run();

  return c.json({
    success: true,
    message: `Highlight ${id} is successfully deleted`,
  });
}).post("/save-page",
  zValidator(
    "json",
    z.object({
      sourceTitle: z.string().min(1),
      sourceLink: z.url(),
      comment: z.string().optional(),
    })
  ),
  async (c) => {
    const { sourceTitle, sourceLink, comment } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);

    await db.insert(annotations).values({ type: "page", sourceTitle, sourceLink, comment }).run();

    return c.json({
      success: true,
      message: `Page is successfully saved`,
    });
  }
).delete("/page/:id", zValidator('param', z.object({
  id: z.string()
})), async (c) => {
  const { id } = c.req.valid("param")
  const db = drizzle(c.env.finestdb);

  await db.delete(annotations).where(eq(annotations.id, Number(id))).run();

  return c.json({
    success: true,
    message: `Page ${id} is successfully deleted`,
  });
}).post("/save-image",
  zValidator(
    "json",
    z.object({
      sourceTitle: z.string().min(1),
      sourceLink: z.url(),
      link: z.url(),
      content: z.string().optional(),
      comment: z.string().optional(),
    })
  ),
  async (c) => {
    const { sourceTitle, sourceLink, content, link, comment } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);

    await db.insert(annotations).values({ type: "image", sourceTitle, sourceLink, content, link, comment }).run();

    return c.json({
      success: true,
      message: `Image is successfully saved`,
    });
  }
).get("/annotations", async (c) => {
  console.log('/annotations', c);
  const db = drizzle(c.env.finestdb);
  const result = await db.select().from(annotations).all();
  return c.json(result);
}).get("/annotations/source", zValidator(
  "query",
  z.object({
    url: z.url()
  })
), async (c) => {
  console.log('/annotations/source', c);
  const { url: sourceUrl } = c.req.valid("query");
  console.log('sourceUrl', sourceUrl);
  const db = drizzle(c.env.finestdb);
  const result = await db.select().from(annotations).where(eq(annotations.sourceLink, sourceUrl))
  console.log('result', result);
  return c.json(result);
});

export type RouteType = typeof route;

export default app;

