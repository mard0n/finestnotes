import { zValidator } from "@hono/zod-validator";
import { notes, pages } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";

interface Article {
  id: number;
  title: string;
  link: string;
  description?: string;
  createdAt: string;
}

const articles = new Hono<{ Bindings: Bindings }>()
  // Get all articles
  .get("/", async (c) => {
    const db = drizzle(c.env.finestdb);

    const [noteData, pageData] = await Promise.all([
      db.select().from(notes).all(),
      db.select().from(pages).all(),
    ]);

    // merge noteData and pageData sort by createdAt
    const articles: Article[] = [
      ...pageData.map(page => ({
        id: page.id,
        title: page.title,
        link: "",
        description: page.comment ?? page.description,
        createdAt: page.createdAt,
      })),
      ...noteData.map(note => ({
        id: note.id,
        title: note.title,
        link: "",
        description: note.content ?? "",
        createdAt: note.createdAt,
      })),
    ];

    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json(articles);
  })


export default articles;