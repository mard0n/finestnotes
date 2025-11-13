import type { InferResponseType } from "hono";
import { client } from "./api";
import type { User as BetterAuthUser } from "better-auth";

export type Projects = InferResponseType<typeof client.api.projects.$get, 200>;
export type User = Pick<BetterAuthUser, "id" | "name">;