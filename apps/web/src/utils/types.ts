import type { InferResponseType } from "hono";
import { client } from "./api";

export type Collections = InferResponseType<typeof client.api.collections.$get>;
export type Projects = InferResponseType<typeof client.api.projects.$get>;
const $article = client.api.articles[":id"].$get;
export type Article = InferResponseType<typeof $article, 200>;
