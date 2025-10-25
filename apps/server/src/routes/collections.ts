import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import * as schema from "../db/schema";
import { notes } from "../db/schema";
import { eq } from "drizzle-orm";
import { protect } from "middlewares/auth.middleware";
import type { User, Session } from "better-auth";
import { normalizeNotes } from "./articles";

const collections = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all collections
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const notesData = await db.query.notes.findMany({
      where: eq(notes.userId, c.var.user.id),
      with: {
        user: true,
        highlights: true,
        images: true,
      },
    });

    console.log('notesData', notesData);
    

    const collections = normalizeNotes(notesData);

    return c.json(collections);
  });

export default collections;
