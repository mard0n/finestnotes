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
    "/recommended",
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
    "/newest",
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

  // Get article by ID
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "query",
      z.object({
        userId: z.string().optional(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { userId } = c.req.valid("query");
      const db = drizzle(c.env.finestdb, { schema: schema });

      let article = await db.query.notes.findFirst({
        with: {
          user: true,
          highlights: true,
          images: true,
          projectNotes: {
            with: {
              project: {
                with: { owner: true },
              },
            },
          },
        },
        where: and(eq(notes.id, id), eq(notes.isPublic, true)),
      });

      if (!article) {
        return c.json(
          {
            success: false,
            message: `Note ${id} not found or is not public.`,
          },
          404
        );
      }

      const { projectNotes, ...rest } = article;

      const publicProjects =
        projectNotes
          ?.filter(
            (pn) => pn.project.isPublic || pn.project.ownerId === userId
          )
          .map((pn) => pn.project) ?? [];

      const [normalizedArticle] = normalizeNotes([
        {
          ...rest,
          projects: publicProjects,
        },
      ]);

      return c.json(normalizedArticle!);
    }
  );

export default articles;

type BaseNoteWithRelations<T extends Record<string, any> = {}> =
  typeof schema.notes.$inferSelect & {
    highlights?: (typeof schema.highlights.$inferSelect)[];
    images?: (typeof schema.images.$inferSelect)[];
  } & T;

type NormalizedNote<T extends Record<string, any> = {}> = Omit<
  BaseNoteWithRelations<T>,
  "highlights" | "images" | "description"
> & {
  type: "note";
};

type NormalizedPage<T extends Record<string, any> = {}> = Omit<
  BaseNoteWithRelations<T>,
  "content" | "contentLexical" | "highlights" | "images"
> & {
  annotations: (
    | typeof schema.highlights.$inferSelect
    | typeof schema.images.$inferSelect
  )[];
  type: "page";
};

type NormalizedArticle<T extends Record<string, any> = {}> =
  | NormalizedNote<T>
  | NormalizedPage<T>;

export function normalizeNotes<T extends Record<string, any> = {}>(
  notes: BaseNoteWithRelations<T>[]
): NormalizedArticle<T>[] {
  const notesData: NormalizedNote<T>[] = notes
    .filter((article) => article.type === "note")
    .map(({ highlights, images, description, ...note }) => ({
      ...note,
      type: "note" as const,
    }));

  const pagesData: NormalizedPage<T>[] = notes
    .filter((article) => article.type === "page")
    .map(({ content, contentLexical, highlights, images, ...page }) => {
      const annotations = [
        ...((highlights ?? []) as (typeof schema.highlights.$inferSelect)[]),
        ...((images ?? []) as (typeof schema.images.$inferSelect)[]),
      ].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
      return {
        ...page,
        annotations,
        type: "page" as const,
      };
    });

  const allArticles = [...notesData, ...pagesData];
  allArticles.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return allArticles;
}
