import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";

const note = new Hono<{ Bindings: Bindings }>()

  // Get all saved notes
  .get("/", async (c) => {
    const db = drizzle(c.env.finestdb);
    const result = await db.select().from(notes).all();
    return c.json(result);
  })

  // Save a note
  .post("/", zValidator("json", z.object({
    userId: z.string().min(1),
    title: z.string().min(1),
    content: z.string().min(1),
  })), async (c) => {
    const { userId, title, content } = c.req.valid("json");
    const db = drizzle(c.env.finestdb);
    await db.insert(notes).values({
      userId,
      title,
      content
    }).run();
    return c.json({
      success: true,
      message: `Note is successfully created`,
    });
  })

  // Delete a saved page
  .delete("/:id", zValidator("param", z.object({
    id: z.string().min(1),
  })), async (c) => {
    const { id } = c.req.valid("param");
    const db = drizzle(c.env.finestdb);
    await db.delete(notes).where(
      eq(notes.id, Number(id))
    ).run();
    return c.json({
      success: true,
      message: `Note ${id} is successfully deleted`,
    });
  });

export default note;