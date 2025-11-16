import { Hono } from "hono";
import z from "zod";
import { and, eq, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { zValidator } from "@hono/zod-validator";
import { notes } from "../../db/schema";
import * as schema from "../../db/schema";
import { normalizeNotesNew } from "../../utils/normalizers";
import type { Bindings } from "../../index";


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
    const results = await db.query.notes
      .findMany({
        with: {
          author: true,
          likes: true,
          comments: true,
          projectsToNotes: {
            with: {
              project: {
                with: {
                  author: true,
                },
              },
            },
          },
        },
        where: and(
          eq(notes.isPublic, true),
          or(
            like(notes.title, searchPattern),
            like(notes.content, searchPattern),
            like(notes.description, searchPattern)
          )
        ),
      })
      .then(normalizeNotesNew);

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limitNum);
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
