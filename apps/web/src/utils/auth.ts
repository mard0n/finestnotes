import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL, // Use the API URL from env
  fetchOptions: {
    credentials: import.meta.env.PROD ? 'same-origin' : 'include', // Required for sending cookies cross-origin
  }
})