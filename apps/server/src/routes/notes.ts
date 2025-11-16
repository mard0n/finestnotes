import { Hono } from "hono";

const notesRoute = new Hono()
  .get("/", async (c) => {
    return c.json(["Hello", "world"]);
  })
  .post("/", async (c) => {
    return c.json({ message: "Create a new note" });
  });

export default notesRoute;
