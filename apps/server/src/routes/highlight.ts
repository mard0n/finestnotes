import { zValidator } from "@hono/zod-validator";
import { highlights, pages } from "../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";

const highlight = new Hono<{ Bindings: Bindings }>()

  // Get all saved highlights for a page url
  .get("/", zValidator("query", z.object({
    page_url: z.url(),
  })), async (c) => {
    const { page_url } = c.req.valid("query");
    const db = drizzle(c.env.finestdb);

    const result = await db
      .select({
        id: highlights.id,
        text: highlights.text,
        position: highlights.position,
        createdAt: highlights.createdAt,
      })
      .from(highlights)
      .innerJoin(pages, eq(highlights.pageId, pages.id))
      .where(eq(pages.url, page_url));

    return c.json(result);
  })

  // Save a highlight
  .post("/", zValidator("json", z.object({
    pageURL: z.string().min(1),
    pageTitle: z.string().min(1),
    pageDescription: z.string().min(1),
    userId: z.string().min(1),
    text: z.string().min(1),
    position: z.string(),
  })), async (c) => {
    const { pageURL, pageTitle, pageDescription, userId, text, position } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);

    let page = await db.select().from(pages).where(eq(pages.url, pageURL)).get();

    if (!page) {
      page = await db.insert(pages).values({
        userId,
        url: pageURL,
        title: pageTitle,
        description: pageDescription,
      }).returning().get();
    }

    const [highlight] = await db.insert(highlights).values({
      userId,
      pageId: page.id,
      text,
      position
    }).returning()

    return c.json(highlight);
  })

  // Delete a saved highlight
  .delete("/:id", zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    const db = drizzle(c.env.finestdb);

    await db.delete(highlights).where(
      eq(highlights.id, Number(id))
    ).run();

    return c.json({
      success: true,
      message: `Highlight ${id} is successfully deleted`,
    });
  });


export default highlight;