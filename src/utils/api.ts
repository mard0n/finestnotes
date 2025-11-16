import { hc } from "hono/client";
import type { RouteType } from "../server";
import { createAuthClient } from "better-auth/client";

export const client = hc<RouteType>(import.meta.env.VITE_API_URL ?? "");

export function createServerClient(headers: Headers) {
  return hc<RouteType>(import.meta.env.VITE_API_URL ?? "", {
    headers: {
      ...Object.fromEntries(headers.entries()),
    },
  });
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});
