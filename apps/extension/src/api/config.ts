import type { RouteType } from '@finest/utils/types'
import { hc } from 'hono/client'
import browser from 'webextension-polyfill';

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) {
  throw new Error("VITE_API_URL is not defined");
}

const client = hc<RouteType>(apiUrl, {
  async fetch(input: RequestInfo | URL, init?: RequestInit) {
    const { authToken } = await browser.storage.local.get("authToken");
    
    const headers = new Headers(init?.headers);
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    return fetch(input, {
      ...init,
      headers,
      credentials: 'omit'
    });
  }
})

export { client };