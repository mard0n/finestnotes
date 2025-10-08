import { zValidator } from "@hono/zod-validator";
import { annotations } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";

const highlight = new Hono<{ Bindings: Bindings }>()

  // Get all highlights for a url
  .get("/", zValidator("query", z.object({
    url: z.url(),
  })), async (c) => {
    const { url } = c.req.valid("query");
    const db = drizzle(c.env.finestdb);
    const result = await db.select().from(annotations).where(
      and(
        eq(annotations.sourceLink, url),
        eq(annotations.type, "highlight")
      )
    ).all();
    return c.json(result);
  })


  // Add a highlight
  .post("/", zValidator("json", z.object({
    sourceTitle: z.string().min(1),
    sourceLink: z.url(),
    content: z.string().min(1),
    link: z.url(),
    comment: z.string().optional(),
  })), async (c) => {
    const { sourceTitle, sourceLink, content, link, comment } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);
    const [highlight] = await db.insert(annotations).values({
      type: "highlight",
      sourceTitle,
      sourceLink,
      content,
      link,
      comment
    }).returning();
    return c.json(highlight);
  })

  // Delete a highlight
  .delete("/:id", zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    const db = drizzle(c.env.finestdb);
    await db.delete(annotations).where(
      and(
        eq(annotations.id, Number(id)),
        eq(annotations.type, "highlight")
      )
    ).run();
    return c.json({
      success: true,
      message: `Highlight ${id} is successfully deleted`,
    });
  });


export default highlight;