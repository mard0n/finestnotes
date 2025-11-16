import { db } from "../db";
import { notes } from "../db/schema"; // TODO: why @db/schema breaking frontend intellisense?
import { Hono } from "hono";

const notesRoute = new Hono()
  .get("/", async (c) => {
    const notesList = await db.select().from(notes).all();
    return c.json(notesList);
  })
  .post("/", async (c) => {
    return c.json({ message: "Create a new note" });
  });

export default notesRoute;
