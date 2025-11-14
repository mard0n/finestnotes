import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { eq, like, or, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";
import { normalizeNotesNew } from "../utils/normalizers";

const search = new Hono<{ Bindings: Bindings }>().get(
  "/",
  zValidator(
    "query",
    z.object({
      q: z.string().min(1),
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("20"),
    })
  ),
  async (c) => {
    const { q, page, limit } = c.req.valid("query");
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const db = drizzle(c.env.finestdb, { schema: schema });

    // Search in public articles only
    const searchPattern = `%${q}%`;
    const results = await db.query.notes.findMany({
      with: {
        author: true,
        likes: true,
        comments: true,
        projectsToNotes: {
          with: {
            project: true,
          },
        },
      },
      extras: {
        likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.note_id = notes.id)`.as("like_count"),
      },
      where: and(
        eq(notes.isPublic, true),
        or(
          like(notes.title, searchPattern),
          like(notes.content, searchPattern),
          like(notes.description, searchPattern)
        )
      ),
    }).then(normalizeNotesNew)

    // Apply pagination
    const paginatedResults = results.slice(
      offset,
      offset + limitNum
    );
    const hasMore = offset + limitNum < results.length;

    return c.json({
      results: paginatedResults,
      hasMore,
      total: results.length,
      page: pageNum,
      limit: limitNum,
      query: q,
    });
  }
);

export default search;
