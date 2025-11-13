import { zValidator } from "@hono/zod-validator";
import { user, projects, notes } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";
import { protect } from "middlewares/auth.middleware";
import type { User, Session } from "better-auth";

const userRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all projects for a user
  .get("/projects", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const userId = c.var.user.id;

    const userProjects = await db.query.user.findMany({
      with: {
        projects: {
          with: {
            author: true,
          },
        },
        projectsToSubscribers: {
          with: {
            project: {
              with: {
                author: true,
              },
            },
          },
        },
      },
      where: eq(user.id, userId),
    });

    if (!userProjects) {
      return c.json({ success: false, message: "Projects not found" }, 404);
    }

    const ownedProjects = userProjects.map((user) => user.projects).flat();
    const subscribedProjects = userProjects
      .map((user) => user.projectsToSubscribers.map((pts) => pts.project))
      .flat();

    const projects = [...ownedProjects, ...subscribedProjects]
      .map(({ author, authorId, description, ...rest }) => ({
        ...rest,
        author: {
          id: author.id,
          name: author.name,
        },
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return c.json(projects);
  })
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
          projects: {
            where: eq(projects.isPublic, true),
            extras: (table, { sql }) => ({
              noteCount: sql<number>`(
                SELECT COUNT(*)
                FROM "projects_to_notes"
                WHERE "projects_to_notes"."project_id" = ${table.id}
              )`.as("note_count"),
            }),
          },
          notes: {
            where: eq(notes.isPublic, true),
            with: {
              projectsToNotes: {
                with: {
                  project: true,
                },
              },
              author: true,
              likes: true,
            },
            extras: {
              likeCount:
                sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.note_id = ${notes.id})`.as(
                  "like_count"
                ),
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
