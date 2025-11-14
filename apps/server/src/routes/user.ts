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
import { normalizeNotesNew, normalizeProjectNew } from "../utils/normalizers";

const userRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all projects for a user.
  // MARK: Refactored
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

    const projects = [...ownedProjects, ...subscribedProjects];
    const normalizedProjects = normalizeProjectNew(projects).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json(normalizedProjects);
  })

  // Get user profile with projects and public notes
  // MARK: Refactored
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
      // MARK: Refactored
      const userData = await db.query.user
        .findFirst({
          columns: {
            id: true,
            name: true,
          },
          where: eq(user.id, id),
          with: {
            projects: {
              where: eq(projects.isPublic, true),
              with: {
                author: true,
                projectsToNotes: {
                  with: {
                    note: {
                      with: { author: true, likes: true, comments: true },
                    },
                  },
                },
              },
            },
            notes: {
              where: eq(notes.isPublic, true),
              with: {
                author: true,
                likes: true,
                comments: true,
              },
            },
          },
        })
        .then((user) => {
          if (!user) return null;

          const normalizedProjects = normalizeProjectNew(user.projects);

          const normalizedNotes = normalizeNotesNew(user.notes);
          return {
            ...user,
            projects: normalizedProjects,
            notes: normalizedNotes,
          };
        });

      console.log("userData", userData);

      if (!userData) {
        return c.json({ success: false, message: "User not found" }, 404);
      }

      return c.json(userData);
    }
  );

export default userRoutes;
