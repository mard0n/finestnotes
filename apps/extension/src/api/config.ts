import type { RouteType } from '@finest/utils/types'
import { hc, InferRequestType, InferResponseType } from 'hono/client'

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) {
  throw new Error("VITE_API_URL is not defined");
}

const client = hc<RouteType>(apiUrl)

const $highlight = client.api.highlight.$post
type HighlightReqType = InferRequestType<typeof $highlight>['json']

const $highlightGet = client.api.highlight.$get
type HighlightResType = InferResponseType<typeof $highlightGet>

const $savePage = client.api.page.$post
type SavePageReqType = InferRequestType<typeof $savePage>['json']

export { client, type HighlightReqType, type HighlightResType, type SavePageReqType };