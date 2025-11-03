import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import type { Session, User } from "better-auth";
import createDOMPurify from "dompurify";
import { parseHTML } from "linkedom";

const note = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all saved notes
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb);
    const result = await db
      .select()
      .from(notes)
      .where(eq(notes.authorId, c.var.user.id))
      .all();
    return c.json(result);
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
