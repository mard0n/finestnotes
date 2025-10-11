import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Bindings } from "index";

import * as schema from "../db/schema";

export const auth = (env: Bindings) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.finestdb, { schema }), { provider: 'sqlite' as const, schema }),
    trustedOrigins: async (request: Request) => {
      const isProd = env.NODE_ENV === 'production';

      return !isProd ? ['http://localhost:*', "chrome-extension://*"] : [];
    },
    emailAndPassword: {
      enabled: true
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: env.NODE_ENV === 'production' ? false : true,
      }
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  });
};