import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import * as schema from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import type { Session, User } from "better-auth";
import createDOMPurify from "dompurify";
import { parseHTML } from "linkedom";
import { normalizeNotes } from "./articles";
import { normalizeNotesNew } from "../utils/normalizers";

const note = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()

  // Get all published notes
  .get(
    "/published",
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

      const notesData = await db.query.notes
        .findMany({
          with: {
            author: true,
            likes: true,
            comments: true,
            projectsToNotes: {
              with: {
                project: {
                  with: {
                    author: true,
                  },
                },
              },
            },
          },
          where: and(eq(notes.isPublic, true)),
        })
        .then(normalizeNotesNew);

      const paginatedArticles = notesData.slice(offset, offset + limitNum);
      const hasMore = offset + limitNum < notesData.length;

      return c.json({
        articles: paginatedArticles,
        hasMore,
        total: notesData.length,
        page: pageNum,
        limit: limitNum,
      });
    }
  )

  // Get all notes (notes and pages)
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const notesData = await db.query.notes
      .findMany({
        with: {
          author: true,
          likes: true,
          highlights: true,
          images: true,
          comments: true,
          bookmarks: true,
          projectsToNotes: {
            with: {
              project: true,
            },
          },
        },
        where: eq(notes.authorId, c.var.user.id),
      })
      .then((notes) => {
        const flattenedResults = notes.map((note) => {
          const { projectsToNotes, likes, comments, ...rest } = note;

          const currentUser = c.var.user;
          const isLikedByCurrentUser = currentUser
            ? likes?.some((like) => like.userId === currentUser.id) ?? false
            : false;
          const isBookmarkedByCurrentUser = currentUser
            ? note.bookmarks?.some(
                (bookmark) => bookmark.userId === currentUser.id
              ) ?? false
            : false;

          const likeCount = likes?.length ?? 0;
          const commentCount = comments?.length ?? 0;

          return {
            ...rest,
            likeCount,
            commentCount,
            projects: projectsToNotes.map((pn) => pn.project) ?? [],
            isLikedByCurrentUser,
            isBookmarkedByCurrentUser,
          };
        });
        return flattenedResults;
      })
      .then(normalizeNotes);

    return c.json(notesData);
  })

  // Get all notes of a project
  .get("/project/:id", protect, async (c) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.finestdb, { schema: schema });

    const project = await db.query.projects
      .findFirst({
        with: {
          projectsToNotes: {
            with: {
              note: {
                with: {
                  author: true,
                  likes: true,
                  comments: true,
                  images: true,
                  highlights: true,
                  projectsToNotes: {
                    with: {
                      project: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: eq(schema.projects.id, id),
      })
      .then((project) => {
        if (!project) return null;
        const { projectsToNotes, ...rest } = project;

        return {
          ...rest,
          notes: normalizeNotes(
            projectsToNotes.map((pn) => {
              const { projectsToNotes, likes, comments, ...rest } = pn.note;
              const currentUser = c.var.user;
              const isLikedByCurrentUser = currentUser
                ? likes?.some((like) => like.userId === currentUser.id) ?? false
                : false;

              const likeCount = likes?.length ?? 0;
              const commentCount = comments?.length ?? 0;

              return {
                ...rest,
                likeCount,
                commentCount,
                projects: projectsToNotes.map((pnn) => pnn.project) ?? [],
                isLikedByCurrentUser,
              };
            })
          ),
        };
      });

    return c.json(project);
  })

  // Get all saved notes
  .get("/saved", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const notesData = await db.query.bookmarks
      .findMany({
        where: eq(schema.bookmarks.userId, c.var.user.id),
        with: {
          note: {
            with: {
              author: true,
              likes: true,
              comments: true,
              images: true,
              highlights: true,
              projectsToNotes: {
                with: {
                  project: true,
                },
              },
            },
          },
        },
      })
      .then((bookmarks) => {
        const notes = bookmarks.map((bookmark) => bookmark.note);
        const flattenedResults = notes.map((note) => {
          const { projectsToNotes, likes, comments, ...rest } = note;
          const currentUser = c.var.user;
          const isLikedByCurrentUser = currentUser
            ? likes?.some((like) => like.userId === currentUser.id) ?? false
            : false;
          const likeCount = likes?.length ?? 0;
          const commentCount = comments?.length ?? 0;

          return {
            ...rest,
            likeCount,
            commentCount,
            projects: projectsToNotes.map((pn) => pn.project) ?? [],
            isLikedByCurrentUser,
            isBookmarkedByCurrentUser: true,
          };
        });
        return flattenedResults;
      })
      .then(normalizeNotes);

    return c.json(notesData);
  })

  // Save a note
  .post(
    "/",
    protect,
    zValidator(
      "json",
      z.object({
        title: z.string(),
        content: z.string(),
        contentLexical: z.string(),
        contentHTML: z.string(),
      })
    ),
    async (c) => {
      const { title, content, contentLexical, contentHTML } =
        c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const { window } = parseHTML("<!DOCTYPE html>");
      const DOMPurify = createDOMPurify(window);
      const cleanHTML = DOMPurify.sanitize(contentHTML);

      const result = await db
        .insert(notes)
        .values({
          authorId: c.var.user.id,
          type: "note",
          title,
          content,
          contentLexical,
          contentHTML: cleanHTML,
        })
        .returning()
        .get();

      return c.json({
        success: true,
        message: `Note is successfully created`,
        data: result,
      });
    }
  )

  // Update note title
  .put(
    "/:id/title",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        title: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { title } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const res = await db
        .update(notes)
        .set({ title })
        .where(and(eq(notes.id, id), eq(notes.authorId, c.var.user.id)))
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          {
            success: false,
            message: `Note ${id} not found or you don't have permission to update it`,
          },
          404
        );
      }

      return c.json({
        success: true,
        message: `Note ${id} title is successfully updated`,
      });
    }
  )

  // Update note content
  .put(
    "/:id/content",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        content: z.string(),
        contentLexical: z.string(),
        contentHTML: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { content, contentLexical, contentHTML } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const { window } = parseHTML("<!DOCTYPE html>");
      const DOMPurify = createDOMPurify(window);
      const cleanHTML = DOMPurify.sanitize(contentHTML);

      const res = await db
        .update(notes)
        .set({ content, contentLexical, contentHTML: cleanHTML })
        .where(and(eq(notes.id, id), eq(notes.authorId, c.var.user.id)))
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          {
            success: false,
            message: `Note ${id} content not found or you don't have permission to update it`,
          },
          404
        );
      }

      return c.json({
        success: true,
        message: `Note ${id} content is successfully updated`,
      });
    }
  )

  // Update a note's visibility
  .put(
    "/:id/visibility",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        isPublic: z.boolean(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { isPublic } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const res = await db
        .update(notes)
        .set({ isPublic })
        .where(and(eq(notes.id, id), eq(notes.authorId, c.var.user.id)))
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          {
            success: false,
            message: `Page ${id} not found or you don't have permission to update it`,
          },
          404
        );
      }

      return c.json({
        success: true,
        message: `Page ${id} visibility is successfully updated`,
      });
    }
  )

  // Delete a saved page
  .delete(
    "/:id",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = drizzle(c.env.finestdb);

      const res = await db
        .delete(notes)
        .where(and(eq(notes.id, id), eq(notes.authorId, c.var.user.id)))
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          {
            success: false,
            message: `Note ${id} not found or you don't have permission to delete it`,
          },
          404
        );
      }

      return c.json({
        success: true,
        message: `Note ${id} is successfully deleted`,
      });
    }
  );

export default note;
