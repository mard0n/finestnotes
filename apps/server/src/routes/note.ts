import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import type { Session, User } from "better-auth";

const note = new Hono<{ Bindings: Bindings, Variables: { user: User; session: Session } }>()
  // Get all saved notes
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb);
    const result = await db.select().from(notes).where(eq(notes.userId, c.var.user.id)).all();
    return c.json(result);
  })

  // Save a note
  .post("/", protect, zValidator("json", z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  })), async (c) => {
    const { title, content } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);

    await db.insert(notes).values({
      userId: c.var.user.id,
      title,
      content
    }).run();

    return c.json({
      success: true,
      message: `Note is successfully created`,
    });
  })

  // Delete a saved page
  .delete("/:id", protect, zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    const db = drizzle(c.env.finestdb);

    const res = await db.delete(notes).where(
      and(
        eq(notes.id, Number(id)),
        eq(notes.userId, c.var.user.id)
      )
    ).run();

    if (res.changes === 0) {
      return c.json({
        success: false,
        message: `Note ${id} not found or you don't have permission to delete it`
      }, 404)
    }

    return c.json({
      success: true,
      message: `Note ${id} is successfully deleted`,
    });
  });

export default note;