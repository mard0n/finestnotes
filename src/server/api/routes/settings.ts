import { Hono } from "hono";
import z from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { zValidator } from "@hono/zod-validator";
import { user } from "../../db/schema";
import * as schema from "../../db/schema";
import { protect } from "../middlewares/protect";
import { auth } from "../../auth";
import type { Bindings } from "../../index";
import type { Session, User } from "better-auth";

const settingsRoutes = new Hono<{
  Bindings: Bindings;
  Variables: { user: User; session: Session };
}>()
  // Get current user profile
  .get("/profile", protect, async (c) => {
    try {
      const db = drizzle(c.env.finestdb, { schema: schema });
      const userId = c.var.user.id;

      const userData = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!userData) {
        return c.json({ success: false, message: "User not found" }, 404);
      }

      return c.json(userData);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return c.json(
        { success: false, message: "Failed to fetch user profile" },
        500
      );
    }
  })

  // Update username
  .patch(
    "/username",
    protect,
    zValidator(
      "json",
      z.object({
        name: z
          .string()
          .min(1, "Username is required")
          .max(50, "Username is too long"),
      })
    ),
    async (c) => {
      try {
        const { name } = c.req.valid("json");
        const db = drizzle(c.env.finestdb, { schema: schema });
        const userId = c.var.user.id;

        await db.update(user).set({ name }).where(eq(user.id, userId));

        return c.json({
          success: true,
          message: "Username updated successfully",
        });
      } catch (error) {
        console.error("Error updating username:", error);
        return c.json(
          { success: false, message: "Failed to update username" },
          500
        );
      }
    }
  )

  // Change password
  .post(
    "/password",
    protect,
    zValidator(
      "json",
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters"),
      })
    ),
    async (c) => {
      try {
        const { currentPassword, newPassword } = c.req.valid("json");
        const userId = c.var.user.id;

        // Get user email from database
        const db = drizzle(c.env.finestdb, { schema: schema });
        const userData = await db.query.user.findFirst({
          where: eq(user.id, userId),
          columns: {
            email: true,
          },
        });

        if (!userData) {
          return c.json({ success: false, message: "User not found" }, 404);
        }

        // Use better-auth to change password
        // First, verify current password by attempting to sign in
        const signInResult = await auth(c.env).api.signInEmail({
          body: {
            email: userData.email,
            password: currentPassword,
          },
        });

        if (!signInResult) {
          return c.json(
            { success: false, message: "Current password is incorrect" },
            401
          );
        }

        // Change password using better-auth
        const result = await auth(c.env).api.changePassword({
          body: {
            newPassword,
            currentPassword,
          },
          headers: c.req.raw.headers,
        });

        if (!result) {
          return c.json(
            { success: false, message: "Failed to change password" },
            500
          );
        }

        return c.json({
          success: true,
          message: "Password changed successfully",
        });
      } catch (error) {
        console.error("Error changing password:", error);
        return c.json(
          {
            success: false,
            message:
              "Failed to change password. Please check your current password.",
          },
          500
        );
      }
    }
  )

  // Delete account
  .delete(
    "/account",
    protect,
    zValidator(
      "json",
      z.object({
        username: z.string().min(1, "Username confirmation is required"),
      })
    ),
    async (c) => {
      try {
        const { username } = c.req.valid("json");
        const db = drizzle(c.env.finestdb, { schema: schema });
        const userId = c.var.user.id;

        // Verify username matches
        const userData = await db.query.user.findFirst({
          where: eq(user.id, userId),
          columns: {
            name: true,
          },
        });

        if (!userData) {
          return c.json({ success: false, message: "User not found" }, 404);
        }

        if (userData.name !== username) {
          return c.json(
            { success: false, message: "Username does not match" },
            400
          );
        }

        // Delete user (cascade will delete related data)
        await db.delete(user).where(eq(user.id, userId));

        return c.json({
          success: true,
          message: "Account deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting account:", error);
        return c.json(
          { success: false, message: "Failed to delete account" },
          500
        );
      }
    }
  );

export default settingsRoutes;
