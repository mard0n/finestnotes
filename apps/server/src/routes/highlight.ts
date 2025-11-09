import { zValidator } from "@hono/zod-validator";
import { highlights, notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import type { Session, User } from "better-auth";

const highlight = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all saved highlights for a page url
  .get(
    "/",
    protect,
    zValidator(
      "query",
      z.object({
        page_url: z.url(),
      })
    ),
    async (c) => {
      const { page_url } = c.req.valid("query");
      const db = drizzle(c.env.finestdb);

      const page = await db
        .select()
        .from(notes)
        .where(eq(notes.url, page_url))
        .get();

      if (!page) {
        return c.json([]);
      }

      const result = await db
        .select()
        .from(highlights)
        .where(eq(highlights.noteId, page.id));

      return c.json(result);
    }
  )

  // Save a highlight
  .post(
    "/",
    protect,
    zValidator(
      "json",
      z.object({
        pageURL: z.string(),
        pageTitle: z.string(),
        pageDescription: z.string().optional(),
        text: z.string(),
        position: z.string(),
      })
    ),
    async (c) => {
      const { pageURL, pageTitle, pageDescription, text, position } =
        c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      let page = await db
        .select()
        .from(notes)
        .where(and(eq(notes.url, pageURL), eq(notes.authorId, c.var.user.id)))
        .get();

      if (!page) {
        page = await db
          .insert(notes)
          .values({
            authorId: c.var.user.id,
            url: pageURL,
            title: pageTitle,
            description: pageDescription,
            type: "page",
          })
          .returning()
          .get();
      }

      const [highlight] = await db
        .insert(highlights)
        .values({
          authorId: c.var.user.id,
          noteId: page.id,
          text,
          position,
        })
        .returning();

      return c.json(highlight);
    }
  )


  // Update highlight comment
  .put(
    "/:id/comment",
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
        comment: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { comment } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const res = await db
        .update(highlights)
        .set({ comment })
        .where(and(eq(highlights.id, id), eq(highlights.authorId, c.var.user.id)))
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

  // Delete a saved highlight
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
        .delete(highlights)
        .where(and(eq(highlights.id, id), eq(highlights.authorId, c.var.user.id)))
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
        message: `Highlight ${id} is successfully deleted`,
      });
    }
  );

export default highlight;
