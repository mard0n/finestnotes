import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Bindings } from "index";

import * as schema from "../db/schema";
import { bearer } from "better-auth/plugins";

export const auth = (env: Bindings) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.finestdb, { schema }), { provider: 'sqlite' as const, schema }),
    trustedOrigins: async (request: Request) => {
      const isProd = env.NODE_ENV === 'production';

      return !isProd ? ['http://localhost:*', "chrome-extension://*"] : []; // TODO: change to more specific
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 // 1 hour
    },
    emailAndPassword: {
      enabled: true
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