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
        projectNotes: {
          with: {
            project: true,
          },
        },
      },
    });

    const flattenedNotes = notesData.map(({ projectNotes, ...note }) => ({
      ...note,
      projects: projectNotes?.map((pn) => pn.project) ?? [],
    }));

    const collections = normalizeNotes(flattenedNotes);

    return c.json(collections);
  })

  // Get collection by ID
  .get("/:id", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });
    const noteId = c.req.param("id");
    console.log('noteId', noteId);
    
    const note = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
      with: {
        user: true,
        highlights: true,
        images: true,
        projectNotes: {
          with: {
            project: true,
          },
        },
      },
    });

    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }

    const isOwnedByUser = note.userId === c.var.user.id;
    const isPublic = note.isPublic;
    if (!isOwnedByUser && !isPublic) {
      return c.json({ message: "Unauthorized" }, 403);
    }

    console.log('note', note);
    
    const { projectNotes, ...rest } = note;

    const [normalizedNote] = normalizeNotes([
      {
        ...rest,
        projects: projectNotes.map((pn) => pn.project) ?? [],
      },
    ]);

    console.log('normalizedNote', normalizedNote);
    
    return c.json(normalizedNote!);
  });

export default collections;
