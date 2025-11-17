import type { User as BetterAuthUser } from "better-auth";

export type User = Pick<BetterAuthUser, "id" | "name">;