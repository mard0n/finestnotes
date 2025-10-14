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
      requireEmailVerification: true
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }, request) => {
        console.log('sendVerificationEmail url', url);
        // const res = await resend.emails.send({
        //   from: 'verify@finestnotes.com',
        //   to: user.email,
        //   subject: 'Verify your email address',
        //   html: `<p>Click <a href="${url}">here</a> to verify your email address.</p>`
        // })
        // console.log('sendVerificationEmail res', res);
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