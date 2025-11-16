/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

import type { Runtime } from "@astrojs/cloudflare";
import type { Session, User } from "better-auth";

declare global {
  namespace App {
    interface Locals extends Runtime<Env> {
      user: Pick<User, "id" | "name"> | null;
      session: Session | null;
    }
  }
}
