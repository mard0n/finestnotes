import type { RouteType } from '@finest/utils/types';
import { hc } from 'hono/client'

const client = hc<RouteType>('https://api.finestnotes.com', { // TODO: Change later
  headers: {
    'Access-Control-Allow-Credentials': 'include', // Required for sending cookies from mydomain.com to api.mydomain.com
    // 'Access-Control-Allow-Credentials': import.meta.env.PROD ? "same-origin" : 'include',
    'accept-encoding': 'gzip, deflate, br',
  },
})

export function createServerClient(headers: Headers) {
  return hc<RouteType>('https://api.finestnotes.com', { // TODO: Change later
    headers: {
      ...Object.fromEntries(headers.entries()),
      'Access-Control-Allow-Credentials': 'include', // Required for sending cookies from mydomain.com to api.mydomain.com
      // 'Access-Control-Allow-Credentials': import.meta.env.PROD ? "same-origin" : 'include',
      'accept-encoding': 'gzip, deflate, br',
    }
  })
}

export { client };