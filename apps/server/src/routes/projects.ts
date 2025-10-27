import { zValidator } from "@hono/zod-validator";
import { projects, projectSubscribers, projectNotes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Bindings } from "../index";
import z from "zod";
import { protect } from "middlewares/auth.middleware";
import type { Session, User } from "better-auth";
import * as schema from "../db/schema";

const projectRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all projects (owned + subscribed)
  .get("/", protect, async (c) => {
    const db = drizzle(c.env.finestdb, { schema: schema });

    // Get owned projects
    const ownedProjects = await db.query.projects.findMany({
      where: eq(projects.ownerId, c.var.user.id),
      with: {
        owner: true,
      },
    });

    // Get subscribed projects
    const subscribedProjects = await db.query.projectSubscribers.findMany({
      where: eq(projectSubscribers.userId, c.var.user.id),
      with: {
        project: {
          with: {
            owner: true,
          },
        },
      },
    });

    const allProjects = [
      ...ownedProjects.map((p) => ({ ...p, role: "owner" as const })),
      ...subscribedProjects.map((s) => ({
        ...s.project,
        role: "subscriber" as const,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return c.json(allProjects);
  })

  // Get a single project with its items
  .get("/:id", protect, async (c) => {
    const { id } = c.req.param();
    const db = drizzle(c.env.finestdb, { schema: schema });

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        owner: true,
        subscribers: {
          with: {
            user: true,
          },
        },
        notes: {
          with: {
            note: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return c.json({ success: false, message: "Project not found" }, 404);
    }

    // Check if user has access
    const isOwner = project.ownerId === c.var.user.id;
    const isSubscriber = project.subscribers.some(
      (sub) => sub.userId === c.var.user.id
    );
    const hasAccess = isOwner || isSubscriber || project.isPublic;

    if (!hasAccess) {
      return c.json({ success: false, message: "Access denied" }, 403);
    }

    const flattenedProject = {
      ...project,
      subscribers: project.subscribers.map((sub) => sub.user),
      notes: project.notes.map((pn) => pn.note),
    };

    return c.json(flattenedProject);
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
          ownerId: c.var.user.id,
          name,
          description: description || null,
          isPublic: isPublic || false,
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
        .where(and(eq(projects.id, id), eq(projects.ownerId, c.var.user.id)))
        .run();

      if (res.changes === 0) {
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
        .where(and(eq(projects.id, id), eq(projects.ownerId, c.var.user.id)))
        .run();

      if (res.changes === 0) {
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
          subscribers: true,
        },
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      const isOwner = project.ownerId === c.var.user.id;
      const isSubscriber = project.subscribers.some(
        (sub) => sub.userId === c.var.user.id
      );

      if (!isOwner && !isSubscriber) {
        return c.json({ success: false, message: "Access denied" }, 403);
      }

      // Check if item already exists in project
      const existingItem = await db.query.projectNotes.findFirst({
        where: and(
          eq(projectNotes.projectId, projectId),
          eq(projectNotes.noteId, noteId)
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
        .insert(projectNotes)
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
          subscribers: true,
        },
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      const isOwner = project.ownerId === c.var.user.id;
      const isSubscriber = project.subscribers.some(
        (sub) => sub.userId === c.var.user.id
      );

      if (!isOwner && !isSubscriber) {
        return c.json({ success: false, message: "Access denied" }, 403);
      }

      const res = await db
        .delete(projectNotes)
        .where(
          and(
            eq(projectNotes.projectId, projectId),
            eq(projectNotes.noteId, noteId)
          )
        )
        .run();

      if (res.changes === 0) {
        return c.json({ success: false, message: "Item not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Item removed from project successfully",
      });
    }
  )

  // Add subscriber to project
  .post(
    "/:id/subscribers",
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
        userId: z.string(),
      })
    ),
    async (c) => {
      const { id: projectId } = c.req.valid("param");
      const { userId } = c.req.valid("json");
      const db = drizzle(c.env.finestdb, { schema: schema });

      // Only owner can add subscribers
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      if (project.ownerId !== c.var.user.id) {
        return c.json(
          { success: false, message: "Only owner can add subscribers" },
          403
        );
      }

      // Check if already subscribed
      const existing = await db.query.projectSubscribers.findFirst({
        where: and(
          eq(projectSubscribers.projectId, projectId),
          eq(projectSubscribers.userId, userId)
        ),
      });

      if (existing) {
        return c.json(
          { success: false, message: "User already subscribed" },
          400
        );
      }

      await db
        .insert(projectSubscribers)
        .values({
          projectId,
          userId,
        })
        .run();

      return c.json({
        success: true,
        message: "Subscriber added successfully",
      });
    }
  )

  // Remove subscriber from project
  .delete(
    "/:id/subscribers/:userId",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
        userId: z.string(),
      })
    ),
    async (c) => {
      const { id: projectId, userId } = c.req.valid("param");
      const db = drizzle(c.env.finestdb, { schema: schema });

      // Only owner can remove subscribers
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        return c.json({ success: false, message: "Project not found" }, 404);
      }

      if (project.ownerId !== c.var.user.id) {
        return c.json(
          { success: false, message: "Only owner can remove subscribers" },
          403
        );
      }

      const res = await db
        .delete(projectSubscribers)
        .where(
          and(
            eq(projectSubscribers.projectId, projectId),
            eq(projectSubscribers.userId, userId)
          )
        )
        .run();

      if (res.changes === 0) {
        return c.json({ success: false, message: "Subscriber not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Subscriber removed successfully",
      });
    }
  );

export default projectRoutes;
