import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import * as schema from "../db/schema";
import { notes } from "../db/schema";
import { eq } from "drizzle-orm";
import { protect } from "middlewares/auth.middleware";
import type { User, Session } from "better-auth";

const collections = new Hono<{ Bindings: Bindings, Variables: { user: User; session: Session } }>()
  // Get all collections
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const [noteData, pageData] = await Promise.all([
      db.query.notes.findMany({
        where: eq(notes.userId, c.var.user.id)
      }),
      db.query.pages.findMany({
        where: eq(notes.userId, c.var.user.id),
        with: {
          highlights: true,
          images: true,
        }
      }),
    ]);

    const collections = [
      ...pageData.map(page => {
        const data = {
          ...page,
          // remove highlights
          highlights: undefined,
          images: undefined,
          content: [
            ...page.highlights,
            ...page.images
          ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        }
        delete data.highlights;
        delete data.images;
        return data;
      }),
      ...noteData,
    ];

    collections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json(collections);
  })

export default collections;