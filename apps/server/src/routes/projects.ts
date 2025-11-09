import { zValidator } from "@hono/zod-validator";
import {
  projects,
  projectsToSubscribers,
  projectsToNotes,
  user,
  notes,
} from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import type { Session, User } from "better-auth";
import * as schema from "../db/schema";
import { normalizeNotes } from "./articles";

const projectRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all projects (owned + subscribed)
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    const userData = await db.query.user.findFirst({
      where: eq(user.id, c.var.user.id),
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
    });

    console.log('userData', userData);
    

    if (!userData) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    const projects = [
      ...userData.projects.map((p) => ({ ...p, role: "owner" as const })),
      ...userData.projectsToSubscribers.map((s) => ({
        ...s.project,
        role: "subscriber" as const,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return c.json(projects);
  })

  // Get a single project with its items
  .get("/:id", protect, async (c) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.finestdb, { schema: schema });

    const project = await db.query.projects
      .findFirst({
        where: eq(projects.id, id),
        with: {
          author: true,
          projectsToSubscribers: {
            with: {
              author: true,
            },
          },
          projectsToNotes: {
            with: {
              note: {
                with: {
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
          },
        },
      })
      .then((project) => {
        if (!project) return null;

        const { projectsToNotes, projectsToSubscribers, ...rest } = project;

        return {
          ...rest,
          notes: normalizeNotes(projectsToNotes.map((pn) => pn.note)),
          subscribers: projectsToSubscribers.map((ps) => ps.author),
        };
      });

    if (!project) {
      return c.json({ success: false, message: "Project not found" }, 404);
    }

    return c.json(project);
  })

  // Is user subscribed to project
  .get("/:id/is-subscribed", protect, async (c) => {
    const { id: projectId } = c.req.param();
    const db = drizzle(c.env.finestdb, { schema: schema });

    const existing = await db.query.projectsToSubscribers.findFirst({
      where: and(
        eq(projectsToSubscribers.projectId, projectId),
        eq(projectsToSubscribers.authorId, c.var.user.id)
      ),
    });

    console.log('existing', existing);
    

    return c.json(!!existing);
  })

  // Create a new project
  .post(
    "/",
    protect,
    zValidator(
      "json",
      z.object({
        name: z.string(),
        description: z.string().optional(),
        isPublic: z.boolean().optional().default(false),
      })
    ),
    async (c) => {
      const { name, description, isPublic } = c.req.valid("json");
      const db = drizzle(c.env.finestdb);

      const result = await db
        .insert(projects)
        .values({
          authorId: c.var.user.id,
          name,
          description: description,
          isPublic: isPublic,
        })
        .returning()
        .get();

      return c.json({
        success: true,
        message: "Project created successfully",
        project: result,
      });
    }
  )

  // Update project
  .put(
    "/:id",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const updates = c.req.valid("json");
      const db = drizzle(c.env.finestdb, { schema: schema });

      const res = await db
        .update(projects)
        .set(updates)
        .where(and(eq(projects.id, id), eq(projects.authorId, c.var.user.id)))
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          {
            success: false,
            message:
              "Project not found or you don't have permission to update it",
          },
          404
        );
      }

      return c.json({
        success: true,
        message: "Project updated successfully",
      });
    }
  )

  // Delete a project
  .delete(
    "/:id",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      const res = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.authorId, c.var.user.id)))
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          {
            success: false,
            message:
              "Project not found or you don't have permission to delete it",
          },
          404
        );
      }

      return c.json({
        success: true,
        message: "Project deleted successfully",
      });
    }
  )

  // Add note to project
  .post(
    "/:id/notes",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        noteId: z.string(),
      })
    ),
    async (c) => {
      const { id: projectId } = c.req.valid("param");
      const { noteId } = c.req.valid("json");
      const db = drizzle(c.env.finestdb, { schema: schema });

      // Check if user has access to the project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
          projectsToSubscribers: true,
        },
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      const isOwner = project.authorId === c.var.user.id;
      const isSubscriber = project.projectsToSubscribers.some(
        (sub) => sub.authorId === c.var.user.id
      );

      if (!isOwner && !isSubscriber) {
        return c.json({ success: false, message: "Access denied" }, 403);
      }

      // Check if item already exists in project
      const existingItem = await db.query.projectsToNotes.findFirst({
        where: and(
          eq(projectsToNotes.projectId, projectId),
          eq(projectsToNotes.noteId, noteId)
        ),
      });

      if (existingItem) {
        return c.json(
          { success: false, message: "Item already exists in project" },
          400
        );
      }

      // Add item to project
      await db
        .insert(projectsToNotes)
        .values({
          projectId,
          noteId,
        })
        .run();

      return c.json({
        success: true,
        message: `Note is added to project successfully`,
      });
    }
  )

  // Remove note from project
  .delete(
    "/:id/notes/:noteId",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
        noteId: z.string(),
      })
    ),
    async (c) => {
      const { id: projectId, noteId } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      // Check if user has access to the project
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
          projectsToSubscribers: true,
        },
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      const isOwner = project.authorId === c.var.user.id;
      const isSubscriber = project.projectsToSubscribers.some(
        (sub) => sub.authorId === c.var.user.id
      );

      if (!isOwner && !isSubscriber) {
        return c.json({ success: false, message: "Access denied" }, 403);
      }

      const res = await db
        .delete(projectsToNotes)
        .where(
          and(
            eq(projectsToNotes.projectId, projectId),
            eq(projectsToNotes.noteId, noteId)
          )
        )
        .run();

      if (res.meta.changes === 0) {
        return c.json({ success: false, message: "Item not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Item removed from project successfully",
      });
    }
  )

  // Subscribe user to project
  .post(
    "/:id/subscribers",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id: projectId } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      // If no userId provided, user is subscribing themselves
      const userIdToSubscribe = c.var.user.id;

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      if (!project.isPublic) {
        return c.json(
          {
            success: false,
            message: "Cannot subscribe to private projects",
          },
          403
        );
      }

      const existing = await db.query.projectsToSubscribers.findFirst({
        where: and(
          eq(projectsToSubscribers.projectId, projectId),
          eq(projectsToSubscribers.authorId, userIdToSubscribe)
        ),
      });

      if (existing) {
        return c.json(
          { success: false, message: "User already subscribed" },
          400
        );
      }

      await db
        .insert(projectsToSubscribers)
        .values({
          projectId,
          authorId: userIdToSubscribe,
        })
        .run();

      return c.json({
        success: true,
        message: "Subscriber added successfully",
      });
    }
  )

  // Unsubscribe from project
  .delete(
    "/:id/subscribers",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id: projectId } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      const userIdToUnsubscribe = c.var.user.id;

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      if (!project.isPublic) {
        return c.json(
          {
            success: false,
            message: "Cannot unsubscribe from private projects",
          },
          403
        );
      }

      const res = await db
        .delete(projectsToSubscribers)
        .where(
          and(
            eq(projectsToSubscribers.projectId, projectId),
            eq(projectsToSubscribers.authorId, userIdToUnsubscribe)
          )
        )
        .run();

      if (res.meta.changes === 0) {
        return c.json(
          { success: false, message: "You are not subscribed to this project" },
          404
        );
      }

      return c.json({
        success: true,
        message: "Unsubscribed successfully",
      });
    }
  );

export default projectRoutes;
