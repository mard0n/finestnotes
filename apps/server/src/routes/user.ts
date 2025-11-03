import { zValidator } from "@hono/zod-validator";
import { user, projects, notes, projectNotes } from "../db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";

const userRoutes = new Hono<{
  Bindings: Bindings;
}>()
  // Get user profile with projects and public notes
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      // Get user
      const userData = await db.query.user.findFirst({
        where: eq(user.id, id),
        with: {
          ownedProjects: {
            where: eq(projects.isPublic, true),
            extras: (table, { sql }) => ({
              noteCount: sql<number>`(
                SELECT COUNT(*)
                FROM "project_notes"
                WHERE "project_notes"."project_id" = ${table.id}
              )`.as('note_count')
            })
          },
          notes: {
            where: eq(notes.isPublic, true),
            with: {
              projectNotes: {
                with: {
                  project: true,
                },
              },
              user: true,
            },
          },
        },
      });

      console.log("userData", userData);

      if (!userData) {
        return c.json({ success: false, message: "User not found" }, 404);
      }

      return c.json(userData);
    }
  );

export default userRoutes;
