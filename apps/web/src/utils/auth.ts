import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: "", // Uses the current origin. Will Proxy through Astro dev server in development. In production, the API will be on the same origin.
  fetchOptions: {
    credentials: import.meta.env.PROD ? 'same-origin' : 'include', // Required for sending cookies cross-origin
  }
})