import { zValidator } from "@hono/zod-validator";
import { annotations } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";

const image = new Hono<{ Bindings: Bindings }>()

  // Get all saved images for a url
  .get("/", zValidator("query", z.object({
    url: z.url(),
  })), async (c) => {
    const { url } = c.req.valid("query");
    const db = drizzle(c.env.finestdb);
    const result = await db.select().from(annotations).where(
      and(
        eq(annotations.sourceLink, url),
        eq(annotations.type, "image")
      )
    ).all();
    return c.json(result);
  })

  // Save an image
  .post("/", zValidator("json", z.object({
    sourceTitle: z.string().min(1),
    sourceLink: z.url(),
    link: z.url(),
    content: z.string().optional(),
    comment: z.string().optional(),
  })), async (c) => {
    const { sourceTitle, sourceLink, content, link, comment } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);
    await db.insert(annotations).values({
      type: "image",
      sourceTitle,
      sourceLink,
      content,
      link,
      comment
    }).run();
    return c.json({
      success: true,
      message: `Image is successfully saved`,
    });
  })

  // Delete a saved image
  .delete("/:id", zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    const db = drizzle(c.env.finestdb);
    await db.delete(annotations).where(
      and(
        eq(annotations.id, Number(id)),
        eq(annotations.type, "image")
      )
    ).run();
    return c.json({
      success: true,
      message: `Image ${id} is successfully deleted`,
    });
  });

export default image;