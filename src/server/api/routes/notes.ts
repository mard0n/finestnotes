import { drizzle } from "drizzle-orm/d1";
import { notes } from "../../db/schema";
import { Hono } from "hono";
import type { Bindings } from "..";

const notesRoute = new Hono<{
  Bindings: Bindings;
}>()
  .get("/", async (c) => {
    console.log('c', c);
    
    const db = drizzle(c.env.finestdb);

    console.log('db', db);
    
    const notesList = await db.select().from(notes).all();
    console.log('notesList', notesList);
    
    return c.json(notesList);
  })
  .post("/", async (c) => {
    return c.json({ message: "Create a new note" });
  });

export default notesRoute;