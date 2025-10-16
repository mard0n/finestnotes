import { zValidator } from "@hono/zod-validator";
import { notes, pages } from "../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";

const articles = new Hono<{ Bindings: Bindings }>()
  // Get all articles
  .get("/", zValidator("query", z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
  })), async (c) => {
    const { page, limit } = c.req.valid("query");
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const db = drizzle(c.env.finestdb, { schema: schema });

    const [noteData, pageData] = await Promise.all([
      db.query.notes.findMany({
        with: {
          user: true
        }
      }),
      db.query.pages.findMany({
        with: {
          user: true
        }
      }),
    ]);

    // merge noteData and pageData sort by createdAt
    const allArticles = [
      ...pageData.map(page => ({
        id: page.id,
        title: page.title,
        link: "",
        description: page.comment ?? page.description,
        createdAt: page.createdAt,
        user: page.user,
      })),
      ...noteData.map(note => ({
        id: note.id,
        title: note.title,
        link: "",
        description: note.content ?? "",
        createdAt: note.createdAt,
        user: note.user,
      })),
    ];

    allArticles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const articles = allArticles.slice(offset, offset + limitNum);
    const hasMore = offset + limitNum < allArticles.length;

    return c.json({
      articles,
      hasMore,
      total: allArticles.length,
      page: pageNum,
      limit: limitNum,
    });
  })
  .get("/:id", zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    // Check both notes and pages tables for the id
    const db = drizzle(c.env.finestdb, { schema: schema });

    const noteArticle = await db.select().from(notes).where(eq(notes.id, Number(id))).get();
    if (noteArticle) {
      return c.json(noteArticle);
    }

    const pageArticle = await db.query.pages.findFirst({
      where: eq(pages.id, Number(id)),
      with: {
        highlights: {
          orderBy: (highlights, { asc }) => [asc(highlights.createdAt)]
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.createdAt)]
        }
      }
    })

    if (pageArticle) {
      // Merge highlights and images into a content array, sorted by createdAt
      const content = [
        ...pageArticle.highlights,
        ...pageArticle.images
      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return c.json({
        ...pageArticle,
        content,
        // Remove individual arrays if you don't want duplicates
        highlights: undefined,
        images: undefined
      });
    }

    return c.json(null);
  });

export default articles;