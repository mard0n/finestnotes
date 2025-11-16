import { Hono } from "hono";
import z from "zod";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { zValidator } from "@hono/zod-validator";
import { notes, images } from "../../db/schema";
import { protect } from "../middlewares/protect";
import type { Bindings } from "../../index";
import type { Session, User } from "better-auth";

const image = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()

  // Get all saved images for a page url
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
        .from(images)
        .where(
          and(eq(images.noteId, page.id), eq(images.authorId, c.var.user.id))
        );

      return c.json(result);
    }
  )

  // Save an image
  .post(
    "/",
    protect,
    zValidator(
      "json",
      z.object({
        pageURL: z.string(),
        pageTitle: z.string(),
        pageDescription: z.string(),
        imageUrl: z.url(),
      })
    ),
    async (c) => {
      const { pageURL, pageTitle, pageDescription, imageUrl } =
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

      await db
        .insert(images)
        .values({
          authorId: c.var.user.id,
          noteId: page.id,
          imageUrl,
        })
        .run();

      return c.json({
        success: true,
        message: `Image is successfully saved`,
      });
    }
  )

  // Update image comment
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
        .update(images)
        .set({ comment })
        .where(and(eq(images.id, id), eq(images.authorId, c.var.user.id)))
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

  // Delete a saved image
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
        .delete(images)
        .where(and(eq(images.id, id), eq(images.authorId, c.var.user.id)))
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
        message: `Image ${id} is successfully deleted`,
      });
    }
  );

export default image;
