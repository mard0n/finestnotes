import type { RouteType } from '@finest/utils/types'
import { hc, InferRequestType } from 'hono/client'

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) {
  throw new Error("VITE_API_URL is not defined");
}

const client = hc<RouteType>(apiUrl)

const $highlight = client.api.highlight.$post
type HighlightReqType = InferRequestType<typeof $highlight>['json']

export { client, type HighlightReqType };