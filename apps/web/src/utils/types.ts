import type { RouteType } from "@finest/utils/types"
import { hc } from "hono/client";

export const client = hc<RouteType>("http://localhost:3000");
