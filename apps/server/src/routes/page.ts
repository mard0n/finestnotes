import { zValidator } from "@hono/zod-validator";
import { pages } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";

const page = new Hono<{ Bindings: Bindings }>()

  // Get all saved pages for a url
  .get("/", zValidator("query", z.object({
    url: z.url(),
  })), async (c) => {
    const { url } = c.req.valid("query");
    const db = drizzle(c.env.finestdb);
    const result = await db.select().from(pages).where(eq(pages.url, url)).get();
    return c.json(result);
  })

  // Save a page
  .post("/", zValidator("json", z.object({
    title: z.string().min(1),
    url: z.url(),
    description: z.string().min(1),
    comment: z.string().optional(),
  })), async (c) => {
    const { title, url, description, comment } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);
    await db.insert(pages).values({
      title,
      url,
      description,
      comment
    }).run();
    return c.json({
      success: true,
      message: `Page is successfully saved`,
    });
  })

  // Delete a saved page
  .delete("/:id", zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    const db = drizzle(c.env.finestdb);
    await db.delete(pages).where(
      eq(pages.id, Number(id))
    ).run();
    return c.json({
      success: true,
      message: `Page ${id} is successfully deleted`,
    });
  });

export default page;