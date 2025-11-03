import { zValidator } from "@hono/zod-validator";
import { notes } from "../db/schema";
import { eq, like, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";
import { normalizeNotes } from "./articles";

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
        highlights: true,
        images: true,
        projectsToNotes: {
          with: {
            project: true,
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
    });

    // Flatten project notes
    const flattenedResults = results.map((result) => {
      const { projectsToNotes, ...rest } = result;
      return {
        ...rest,
        projects: projectsToNotes?.filter((pn) => pn.project.isPublic).map((pn) => pn.project) ?? [],
      };
    });

    const normalizedResults = normalizeNotes(flattenedResults);

    // Apply pagination
    const paginatedResults = normalizedResults.slice(
      offset,
      offset + limitNum
    );
    const hasMore = offset + limitNum < normalizedResults.length;

    return c.json({
      results: paginatedResults,
      hasMore,
      total: normalizedResults.length,
      page: pageNum,
      limit: limitNum,
      query: q,
    });
  }
);

export default search;
