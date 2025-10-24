import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";

const articles = new Hono<{ Bindings: Bindings }>()
  // Get all articles
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        page: z.string().optional().default("1"),
        limit: z.string().optional().default("20"),
      })
    ),
    async (c) => {
      const { page, limit } = c.req.valid("query");
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const db = drizzle(c.env.finestdb, { schema: schema });

      const articles = await db.query.notes.findMany({
        with: {
          user: true,
        },
        where: eq(notes.isPublic, true),
      });

      const normalizedArticles = normalizeNotes(articles);

      // Apply pagination
      const paginatedArticles = normalizedArticles.slice(
        offset,
        offset + limitNum
      );
      const hasMore = offset + limitNum < normalizedArticles.length;

      return c.json({
        articles: paginatedArticles,
        hasMore,
        total: normalizedArticles.length,
        page: pageNum,
        limit: limitNum,
      });
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().min(1),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      // Check both notes and pages tables for the id
      const db = drizzle(c.env.finestdb, { schema: schema });

      const articles = await db.query.notes.findMany({
        with: {
          user: true,
          highlights: true,
          images: true,
        },
        where: and(eq(notes.id, id), eq(notes.isPublic, true)),
      });

      if (!articles) {
        return c.json(
          {
            success: false,
            message: `Note ${id} not found or is not public.`,
          },
          404
        );
      }

      return c.json(normalizeNotes(articles));
    }
  );

export default articles;

export function normalizeNotes(
  notes: (typeof schema.notes.$inferSelect & {
    user: typeof schema.user.$inferSelect;
    highlights?: (typeof schema.highlights.$inferSelect)[];
    images?: (typeof schema.images.$inferSelect)[];
  })[]
) {
  const notesData = notes
    .filter((article) => article.type === "note")
    .map(({ highlights, images, description, ...note }) => ({
      ...note,
      type: "note" as const,
    }));

  const pagesData = notes
    .filter((article) => article.type === "page")
    .map(({ content, contentLexical, ...page }) => {
      const annotations = [
        ...(page.highlights || []),
        ...(page.images || []),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return {
        ...page,
        annotations,
        type: "page" as const,
      };
    })
    .map(({ highlights, images, ...page }) => ({
      ...page,
    }));

  const allArticles = [...notesData, ...pagesData];
  allArticles.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return allArticles;
}
