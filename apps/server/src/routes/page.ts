import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import { Session, User } from "better-auth";

const page = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()

  // Get all saved pages for a url
  .get(
    "/",
    protect,
    zValidator(
      "query",
      z.object({
        url: z.url(),
      })
    ),
    async (c) => {
      const { url } = c.req.valid("query");
      const db = drizzle(c.env.finestdb);

      const result = await db
        .select()
        .from(notes)
        .where(and(eq(notes.url, url), eq(notes.authorId, c.var.user.id)))
        .get();

      if (!result) {
        return c.json({
          success: false,
          message: `Page with url ${url} not found.`,
        });
      }

      return c.json({ success: true, data: result });
    }
  )

  // Save a page
  .post(
    "/",
    protect,
    zValidator(
      "json",
      z.object({
        title: z.string(),
        url: z.url(),
        description: z.string(),
      })
    ),
    async (c) => {
      const { title, url, description } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      await db
        .insert(notes)
        .values({
          type: "page",
          authorId: c.var.user.id,
          title,
          url,
          description,
        })
        .run();

      return c.json({
        success: true,
        message: `Page is successfully saved`,
      });
    }
  )

  // Update a page's description
  .put(
    "/:id/description",
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
        description: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { description } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const res = await db
        .update(notes)
        .set({ description })
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
        message: `Page ${id} description is successfully updated`,
      });
    }
  )

export default page;
