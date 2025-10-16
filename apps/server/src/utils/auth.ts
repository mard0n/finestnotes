import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Bindings } from "index";

import * as schema from "../db/schema";
import { bearer } from "better-auth/plugins";
import { resend } from "./email";

export const auth = (env: Bindings) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.finestdb, { schema }), { provider: 'sqlite' as const, schema }),
    trustedOrigins: async (request: Request) => {
      const isProd = env.NODE_ENV === 'production';

      return !isProd ? ['http://localhost:*', "chrome-extension://*"] : []; // TODO: change to more specific
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }, request) => {
        console.log('sendResetPassword url', url);
        try {
          const res = await resend.emails.send({
            from: 'noreply@finestnotes.com', // Update with your verified domain
            to: user.email,
            subject: 'Reset your password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Reset Your Password</h2>
                <p>Hello ${user.name || 'there'},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #999; font-size: 12px; word-break: break-all;">${url}</p>
              </div>
            `
          });
          console.log('sendResetPassword res', res);
        } catch (error) {
          console.error('Failed to send password reset email:', error);
          throw error;
        }
      },
      onPasswordReset: async ({ user }, request) => {
        console.log(`Password for user ${user.email} has been reset.`);
        // You can add additional logic here, such as:
        // - Logging the password reset event
        // - Sending a confirmation email
        // - Invalidating other sessions
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }, request) => {
        console.log('sendVerificationEmail url', url);
        try {
          const res = await resend.emails.send({
            from: 'noreply@finestnotes.com', // Update with your verified domain
            to: user.email,
            subject: 'Verify your email address',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Finest Notes!</h2>
                <p>Hello ${user.name || 'there'},</p>
                <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #999; font-size: 12px; word-break: break-all;">${url}</p>
              </div>
            `
          });
          console.log('sendVerificationEmail res', res);
        } catch (error) {
          console.error('Failed to send verification email:', error);
          throw error;
        }
      }
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: false // set to true if you want to share cookies across subdomains but localhost won't work with this
      },
      defaultCookieAttributes: {
        sameSite: env.NODE_ENV === 'production' ? 'lax' : 'none',
        httpOnly: env.NODE_ENV === 'production' ? true : false,
        secure: true // required cuz sameSite none
      }
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    plugins: [
      bearer()
    ]
  });
};