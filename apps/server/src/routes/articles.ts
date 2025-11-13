import { zValidator } from "@hono/zod-validator";
import { notes, likes, bookmarks } from "../db/schema";
import { and, eq, getTableColumns, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";

import { auth } from "utils/auth";
import { protect } from "../middlewares/auth.middleware";
import type { Session, User } from "better-auth";

const articles = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all articles
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        page: z.string(),
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
          author: true,
          likes: true,
          comments: true,
        },
        extras: {
          likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.note_id = notes.id)`.as("like_count"),
          commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.note_id = notes.id)`.as("comment_count"),
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
    async (c) => {
      const { id } = c.req.valid("param");
      const session = await auth(c.env).api.getSession({
        headers: c.req.raw.headers,
      });
      const currentUser = session?.user;

      const db = drizzle(c.env.finestdb, { schema });

      // OPTION: Number 1
      // Problem: Couldn't figure out how to filter related and nested projects
      // let article = await db.query.notes.findFirst({
      //   with: {
      //     author: true,
      //     highlights: true,
      //     images: true,
      //     projectsToNotes: {
      //       with: {
      //         project: {
      //           with: { author: true },
      //         },
      //       },
      //       where: // filter projects that are public or owned by the user. Couldn't figure it out
      //     },
      //   },
      //   where: and(eq(notes.id, id), eq(notes.isPublic, true)),
      // });

      // OPTION: Number 2
      // Problem: Aggregation is super complex.
      // https://orm.drizzle.team/docs/joins#aggregating-results
      // const { notes, projectsToNotes, projects, user } = schema;
      // const notesColumns = getTableColumns(notes);
      // let article = await db
      //   .select()
      //   .from(notes)
      //   .leftJoin(projectsToNotes, eq(notes.id, projectsToNotes.noteId))
      //   .leftJoin(projects, eq(projectsToNotes.projectId, projects.id))
      //   .leftJoin(user, eq(notes.authorId, user.id))
      //   .where(
      //     and(
      //       eq(notes.id, id),
      //       eq(notes.isPublic, true),
      //       or(
      //         eq(projects.isPublic, true),
      //         eq(projects.authorId, currentUser?.id || "")
      //       )
      //     )
      //   )
      //   .limit(1);

      // OPTION: Number 3
      // Manual filtering after fetching the article
      let article = await db.query.notes
        .findFirst({
          with: {
            author: true,
            highlights: true,
            images: true,
            likes: true,
            bookmarks: true,
            projectsToNotes: {
              with: {
                project: {
                  with: { author: true },
                },
              },
            },
          },
          extras: {
            likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.note_id = ${notes.id})`.as("like_count"),
          },
          where: and(eq(notes.id, id), eq(notes.isPublic, true)),
        })
        .then((note) => {
          if (!note) return null;
          const { projectsToNotes, likes: noteLikes, bookmarks: noteBookmarks, ...rest } = note;

          // Return only public or projects owned by the current user
          const publicOrMyProjects =
            projectsToNotes
              ?.filter(
                (pn) =>
                  pn.project.isPublic || pn.project.authorId === currentUser?.id
              )
              .map((pn) => pn.project) ?? [];

          const isLikedByCurrentUser = currentUser
            ? noteLikes?.some((like) => like.userId === currentUser.id) ?? false
            : false;

          const isBookmarkedByCurrentUser = currentUser
            ? noteBookmarks?.some((bookmark) => bookmark.userId === currentUser.id) ?? false
            : false;

          return {
            ...rest,
            projects: publicOrMyProjects,
            isLikedByCurrentUser,
            isBookmarkedByCurrentUser,
          };
        })
        .then((article) => article && normalizeNotes([article])[0]);

      if (!article) {
        return c.json(
          {
            success: false,
            message: `Note ${id} not found or is not public.`,
          },
          404
        );
      }

      return c.json(article);
    }
  )

  // Like an article
  .post(
    "/:id/like",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if article exists and is public
      const article = await db.query.notes.findFirst({
        where: and(eq(notes.id, id), eq(notes.isPublic, true)),
      });

      if (!article) {
        return c.json(
          {
            success: false,
            message: "Article not found or is not public",
          },
          404
        );
      }

      // Check if already liked
      const existingLike = await db.query.likes.findFirst({
        where: and(eq(likes.noteId, id), eq(likes.userId, userId)),
      });

      if (existingLike) {
        return c.json(
          {
            success: false,
            message: "Article already liked",
          },
          400
        );
      }

      // Create like
      await db.insert(likes).values({
        noteId: id,
        userId: userId,
      });

      // Get updated like count
      const likeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.noteId, id))
        .get();

      return c.json({
        success: true,
        likeCount: likeCount?.count ?? 0,
      });
    }
  )

  // Unlike an article
  .delete(
    "/:id/like",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Delete like
      const result = await db
        .delete(likes)
        .where(and(eq(likes.noteId, id), eq(likes.userId, userId)));

      // Get updated like count
      const likeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(likes)
        .where(eq(likes.noteId, id))
        .get();

      return c.json({
        success: true,
        likeCount: likeCount?.count ?? 0,
      });
    }
  )

  // Bookmark an article
  .post(
    "/:id/bookmark",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if article exists and is public
      const article = await db.query.notes.findFirst({
        where: and(eq(notes.id, id), eq(notes.isPublic, true)),
      });

      if (!article) {
        return c.json(
          {
            success: false,
            message: "Article not found or is not public",
          },
          404
        );
      }

      // Check if already bookmarked
      const existingBookmark = await db.query.bookmarks.findFirst({
        where: and(eq(bookmarks.noteId, id), eq(bookmarks.userId, userId)),
      });

      if (existingBookmark) {
        return c.json(
          {
            success: false,
            message: "Article already bookmarked",
          },
          400
        );
      }

      // Create bookmark
      await db.insert(bookmarks).values({
        noteId: id,
        userId: userId,
      });

      return c.json({
        success: true,
        message: "Article bookmarked successfully",
      });
    }
  )

  // Unbookmark an article
  .delete(
    "/:id/bookmark",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Delete bookmark
      const result = await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.noteId, id), eq(bookmarks.userId, userId)));

      return c.json({
        success: true,
        message: "Article unbookmarked successfully",
      });
    }
  );

export default articles;

type BaseNoteWithRelations<T extends Record<string, any> = {}> =
  typeof schema.notes.$inferSelect & {
    highlights?: (typeof schema.highlights.$inferSelect)[];
    images?: (typeof schema.images.$inferSelect)[];
    likes?: (typeof schema.likes.$inferSelect)[];
  } & T;

type NormalizedNote<T extends Record<string, any> = {}> = Omit<
  BaseNoteWithRelations<T>,
  "highlights" | "images" | "description" | "likes"
> & {
  type: "note";
};

type NormalizedPage<T extends Record<string, any> = {}> = Omit<
  BaseNoteWithRelations<T>,
  "content" | "contentLexical" | "highlights" | "images" | "likes"
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
    .map(({ highlights, images, description, likes, ...note }) => ({
      ...note,
      type: "note" as const,
    }));

  const pagesData: NormalizedPage<T>[] = notes
    .filter((article) => article.type === "page")
    .map(({ content, contentLexical, highlights, images, likes, ...page }) => {
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
