import { Hono } from "hono";

const pagesRoute = new Hono()
  .get("/", async (c) => {
    return c.json({ notes: [] });
  })
  .post("/", async (c) => {
    return c.json({ message: "Create a new note" });
  });

export default pagesRoute;
