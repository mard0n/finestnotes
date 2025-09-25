import type { RouteType } from '@finest/utils/types'
import { hc, InferRequestType, InferResponseType } from 'hono/client'

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) {
  throw new Error("VITE_API_URL is not defined");
}

const client = hc<RouteType>(apiUrl)

const $highlight = client.api.highlight.$post
type HighlightReqType = InferRequestType<typeof $highlight>['json']

const $annotations = client.api.annotations.source.$get
type AnnotationsResType = InferResponseType<typeof $annotations>

export { client, type HighlightReqType, type AnnotationsResType };