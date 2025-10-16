import type { RouteType } from '@finest/utils/types';
import { hc } from 'hono/client'

const client = hc<RouteType>(import.meta.env.VITE_API_URL || '', {
  headers: {
    'Access-Control-Allow-Credentials': import.meta.env.PROD ? "same-origin" : 'include',
  },
})

export function createServerClient(headers: Headers) {
  const headersObject: Record<string, string> = {};

  headers.forEach((value, key) => {
    headersObject[key] = value;
  });

  return hc<RouteType>(import.meta.env.VITE_API_URL || '', {
    headers: {
      ...headersObject,
      'Access-Control-Allow-Credentials': import.meta.env.PROD ? "same-origin" : 'include',
    }
  })
}

export { client };