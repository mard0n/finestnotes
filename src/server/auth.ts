import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { Bindings } from ".";

import * as schema from "./db/schema";
import { bearer } from "better-auth/plugins";

export const auth = (env: Bindings) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.finestdb, { schema }), {
      provider: "sqlite" as const,
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    trustedOrigins: async (request: Request) => {
      const isProd = import.meta.env.PROD;

      return !isProd
        ? ["http://localhost:*", "chrome-extension://*"]
        : [
            "https://finestnotes.com",
            "chrome-extension://gnoknopednpdpmkemfmhanmpgmfnfhho",
          ];
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    plugins: [bearer()],
  });
};
