/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  // Note: 'import {} from ""' syntax does not work in .d.ts files.
  interface Locals {
    user: {
      name: import("better-auth").User.name;
      id: import("better-auth").User.id;
    } | null;
    session: import("better-auth").Session | null;
  }
}
