import { zValidator } from "@hono/zod-validator";
import { comments, commentReactions } from "../db/schema";
import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { type Bindings } from "../index";
import z from "zod";
import * as schema from "../db/schema";

import { auth } from "utils/auth";
import { protect } from "../middlewares/auth.middleware";
import type { Session, User } from "better-auth";

const commentsRouter = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get all comments for an article (including nested comments)
  .get(
    "/article/:noteId",
    zValidator(
      "param",
      z.object({
        noteId: z.string(),
      })
    ),
    async (c) => {
      const { noteId } = c.req.valid("param");
      const session = await auth(c.env).api.getSession({
        headers: c.req.raw.headers,
      });
      const currentUser = session?.user;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if article exists and is public
      const article = await db.query.notes.findFirst({
        where: eq(schema.notes.id, noteId),
      });

      if (!article) {
        return c.json(
          {
            success: false,
            message: "Article not found or is not public",
          },
          404
        );
      }

      // Get all comments for the article with their reactions
      const allComments = await db.query.comments.findMany({
        where: eq(comments.noteId, noteId),
        with: {
          author: true,
          reactions: true,
        },
        orderBy: [desc(comments.createdAt)],
      });

      // Define the type for a comment with computed stats and replies
      type CommentWithStats = typeof allComments[number] & {
        likeCount: number;
        dislikeCount: number;
        userReaction: "like" | "dislike" | null;
        replies: CommentWithStats[];
      };

      // Organize comments into a nested structure
      const commentMap = new Map<string, CommentWithStats>();
      const rootComments: CommentWithStats[] = [];

      // First pass: create map of all comments with computed fields
      allComments.forEach((comment) => {
        const likeCount = comment.reactions.filter((r) => r.type === "like").length;
        const dislikeCount = comment.reactions.filter((r) => r.type === "dislike").length;
        const userReaction = currentUser
          ? comment.reactions.find((r) => r.userId === currentUser.id)?.type || null
          : null;

        const commentWithStats: CommentWithStats = {
          ...comment,
          likeCount,
          dislikeCount,
          userReaction,
          replies: [],
        };

        commentMap.set(comment.id, commentWithStats);
      });

      // Second pass: organize into tree structure
      allComments.forEach((comment) => {
        const commentWithStats = commentMap.get(comment.id);
        if (!commentWithStats) return;

        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId);
          if (parent) {
            parent.replies.push(commentWithStats);
          }
        } else {
          rootComments.push(commentWithStats);
        }
      });

      // Sort replies by createdAt (oldest first for nested comments)
      const sortReplies = (comment: CommentWithStats): void => {
        if (comment.replies.length > 0) {
          comment.replies.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          comment.replies.forEach(sortReplies);
        }
      };

      rootComments.forEach(sortReplies);

      return c.json({
        comments: rootComments,
        total: allComments.length,
      });
    }
  )

  // Create a new comment (top-level or reply)
  .post(
    "/",
    protect,
    zValidator(
      "json",
      z.object({
        noteId: z.string(),
        content: z.string().min(1).max(5000),
        parentCommentId: z.string().optional(),
      })
    ),
    async (c) => {
      const { noteId, content, parentCommentId } = c.req.valid("json");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if article exists and is public
      const article = await db.query.notes.findFirst({
        where: eq(schema.notes.id, noteId),
      });

      if (!article || !article.isPublic) {
        return c.json(
          {
            success: false,
            message: "Article not found or is not public",
          },
          404
        );
      }

      // If replying to a comment, verify it exists
      if (parentCommentId) {
        const parentComment = await db.query.comments.findFirst({
          where: and(
            eq(comments.id, parentCommentId),
            eq(comments.noteId, noteId)
          ),
        });

        if (!parentComment) {
          return c.json(
            {
              success: false,
              message: "Parent comment not found",
            },
            404
          );
        }
      }

      // Create the comment
      const newComment = await db
        .insert(comments)
        .values({
          authorId: userId,
          noteId: noteId,
          parentCommentId: parentCommentId || null,
          content: content,
        })
        .returning()
        .get();

      // Fetch the complete comment with author info
      const completeComment = await db.query.comments.findFirst({
        where: eq(comments.id, newComment.id),
        with: {
          author: true,
          reactions: true,
        },
      });

      return c.json(
        {
          success: true,
          comment: {
            ...completeComment,
            likeCount: 0,
            dislikeCount: 0,
            userReaction: null,
            replies: [],
          },
        },
        201
      );
    }
  )

  // Update a comment
  .patch(
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
        content: z.string().min(1).max(5000),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { content } = c.req.valid("json");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if comment exists and user is the author
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!comment) {
        return c.json(
          {
            success: false,
            message: "Comment not found",
          },
          404
        );
      }

      if (comment.authorId !== userId) {
        return c.json(
          {
            success: false,
            message: "Unauthorized to edit this comment",
          },
          403
        );
      }

      // Update the comment
      await db
        .update(comments)
        .set({
          content: content,
        })
        .where(eq(comments.id, id));

      // Fetch updated comment
      const updatedComment = await db.query.comments.findFirst({
        where: eq(comments.id, id),
        with: {
          author: true,
          reactions: true,
        },
      });

      return c.json({
        success: true,
        comment: updatedComment,
      });
    }
  )

  // Delete a comment
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
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if comment exists and user is the author
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!comment) {
        return c.json(
          {
            success: false,
            message: "Comment not found",
          },
          404
        );
      }

      if (comment.authorId !== userId) {
        return c.json(
          {
            success: false,
            message: "Unauthorized to delete this comment",
          },
          403
        );
      }

      // Delete the comment (cascades to reactions and replies)
      await db.delete(comments).where(eq(comments.id, id));

      return c.json({
        success: true,
        message: "Comment deleted successfully",
      });
    }
  )

  // React to a comment (like or dislike)
  .post(
    "/:id/react",
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
        type: z.enum(["like", "dislike"]),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { type } = c.req.valid("json");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Check if comment exists
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, id),
      });

      if (!comment) {
        return c.json(
          {
            success: false,
            message: "Comment not found",
          },
          404
        );
      }

      // Check if user already reacted
      const existingReaction = await db.query.commentReactions.findFirst({
        where: and(
          eq(commentReactions.commentId, id),
          eq(commentReactions.userId, userId)
        ),
      });

      if (existingReaction) {
        // If same reaction, remove it (toggle off)
        if (existingReaction.type === type) {
          await db
            .delete(commentReactions)
            .where(
              and(
                eq(commentReactions.commentId, id),
                eq(commentReactions.userId, userId)
              )
            );

          // Get updated counts
          const reactions = await db.query.commentReactions.findMany({
            where: eq(commentReactions.commentId, id),
          });

          return c.json({
            success: true,
            reaction: null,
            likeCount: reactions.filter((r) => r.type === "like").length,
            dislikeCount: reactions.filter((r) => r.type === "dislike").length,
          });
        } else {
          // If different reaction, update it
          await db
            .update(commentReactions)
            .set({ type: type })
            .where(
              and(
                eq(commentReactions.commentId, id),
                eq(commentReactions.userId, userId)
              )
            );
        }
      } else {
        // Create new reaction
        await db.insert(commentReactions).values({
          commentId: id,
          userId: userId,
          type: type,
        });
      }

      // Get updated counts
      const reactions = await db.query.commentReactions.findMany({
        where: eq(commentReactions.commentId, id),
      });

      return c.json({
        success: true,
        reaction: type,
        likeCount: reactions.filter((r) => r.type === "like").length,
        dislikeCount: reactions.filter((r) => r.type === "dislike").length,
      });
    }
  )

  // Remove reaction from a comment
  .delete(
    "/:id/react",
    protect,
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const userId = c.var.user.id;

      const db = drizzle(c.env.finestdb, { schema });

      // Delete reaction
      await db
        .delete(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, id),
            eq(commentReactions.userId, userId)
          )
        );

      // Get updated counts
      const reactions = await db.query.commentReactions.findMany({
        where: eq(commentReactions.commentId, id),
      });

      return c.json({
        success: true,
        likeCount: reactions.filter((r) => r.type === "like").length,
        dislikeCount: reactions.filter((r) => r.type === "dislike").length,
      });
    }
  );

export default commentsRouter;
