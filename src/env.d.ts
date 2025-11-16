/// <reference path="../.astro/types.d.ts" />

import type { Runtime } from "@astrojs/cloudflare";

declare global {
  namespace App {
    interface Locals extends Runtime<Env> {}
  }
}
