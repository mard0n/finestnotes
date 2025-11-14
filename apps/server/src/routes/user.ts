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
  // MARK: Refactored v2
  .get("/projects", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const userId = c.var.user.id;

    const userData = await db.query.user.findFirst({
      with: {
        projects: {
          with: {
            author: true,
            projectsToNotes: {
              // HACK: unnecessary. Required for normalization
              with: {
                note: {
                  with: { author: true, likes: true, comments: true },
                },
              },
            },
          },
        },
        projectsToSubscribers: {
          with: {
            project: {
              with: {
                author: true,
                projectsToNotes: {
                  // HACK: unnecessary. Required for normalization
                  with: {
                    note: {
                      with: { author: true, likes: true, comments: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: eq(user.id, userId),
    });

    if (!userData) {
      return c.json({ success: false, message: "Projects not found" }, 404);
    }

    const ownedProjects = userData.projects;
    const subscribedAndPublicProjects = userData.projectsToSubscribers
      .map((pts) => pts.project)
      .filter((project) => project.isPublic);

    const projects = [...ownedProjects, ...subscribedAndPublicProjects];
    const normalizedProjects = normalizeProjectNew(projects).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json(normalizedProjects);
  })

  // Get user profile not me
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
      const userData = await db.query.user.findFirst({
        columns: {
          id: true,
          name: true,
        },
        where: eq(user.id, id),
      });

      if (!userData) {
        return c.json({ success: false, message: "User not found" }, 404);
      }

      return c.json(userData);
    }
  )

  // Get public projects for a user
  // MARK: Refactored v2
  .get(
    "/:id/projects",
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      const userData = await db.query.user.findFirst({
        with: {
          projects: {
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
            where: eq(projects.isPublic, true),
          },
        },
        where: eq(user.id, id),
      });

      if (!userData) {
        return c.json({ success: false, message: "Projects not found" }, 404);
      }

      const normalizedProjects = normalizeProjectNew(userData.projects).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return c.json(normalizedProjects);
    }
  )

  // Get public notes for a user
  // MARK: Refactored v2
  .get(
    "/:id/notes",
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      const userData = await db.query.user.findFirst({
        with: {
          notes: {
            with: { author: true, likes: true, comments: true },
            where: eq(notes.isPublic, true),
          },
        },
        where: eq(user.id, id),
      });

      if (!userData) {
        return c.json({ success: false, message: "Notes not found" }, 404);
      }

      const notesData = userData.notes.map((note) => ({
        ...note,
        projectsToNotes: [], // HACK: to satisfy normalizer
      }));

      const normalizedNotes = normalizeNotesNew(notesData)
        .map(({ projects, ...rest }) => ({ ...rest }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return c.json(normalizedNotes);
    }
  );

export default userRoutes;
