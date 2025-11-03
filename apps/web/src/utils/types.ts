import type { InferResponseType } from "hono";
import { client } from "./api";

export type Projects = InferResponseType<typeof client.api.projects.$get, 200>;
const $article = client.api.articles[":id"].$get;
export type Article = InferResponseType<typeof $article, 200>;
