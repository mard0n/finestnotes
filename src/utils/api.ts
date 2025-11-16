import { hc } from "hono/client";
import type { RouteType } from "../server/api";

export const client = hc<RouteType>(import.meta.env.VITE_API_URL);

export function createServerClient(headers: Headers) {
  return hc<RouteType>(import.meta.env.VITE_API_URL, {
    headers: {
      ...Object.fromEntries(headers.entries()),
    },
  });
}
