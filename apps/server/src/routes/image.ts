import { zValidator } from "@hono/zod-validator";
import { images, pages } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";

const image = new Hono<{ Bindings: Bindings }>()

  // Get all saved images for a page url
  .get("/", zValidator("query", z.object({
    page_url: z.url(),
  })), async (c) => {
    const { page_url } = c.req.valid("query");
    const db = drizzle(c.env.finestdb);

    const result = await db
      .select({
        id: images.id,
        imageUrl: images.imageUrl,
        caption: images.caption,
        createdAt: images.createdAt,
      })
      .from(images)
      .innerJoin(pages, eq(images.pageId, pages.id))
      .where(eq(pages.url, page_url));

    return c.json(result);
  })

  // Save an image
  .post("/", zValidator("json", z.object({
    pageURL: z.string().min(1),
    pageTitle: z.string().min(1),
    pageDescription: z.string().min(1),
    imageUrl: z.url(),
    caption: z.string().optional(),
  })), async (c) => {
    const { pageURL, pageTitle, pageDescription, imageUrl, caption } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);

    let page = await db.select().from(pages).where(eq(pages.url, pageURL)).get();

    if (!page) {
      page = await db.insert(pages).values({
        url: pageURL,
        title: pageTitle,
        description: pageDescription,
      }).returning().get();
    }

    await db.insert(images).values({
      pageId: page.id,
      imageUrl,
      caption
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
    await db.delete(images).where(
      eq(images.id, Number(id))
    ).run();
    return c.json({
      success: true,
      message: `Image ${id} is successfully deleted`,
    });
  });

export default image;