import { createAuthClient } from "better-auth/client"
import { createAuthClient as createAuthClientSolid } from "better-auth/solid"
import browser from "webextension-polyfill";


export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  fetchOptions: {
    credentials: "omit",
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token")
      if (authToken) {
        browser.storage.local.set({ "authToken": authToken });
      }
    },
    auth: {
      type: "Bearer",
      token: async () => {
        const result = await browser.storage.local.get("authToken");
        return result.authToken || "";
      },

    }
  }
})

export const authClientSolid = createAuthClientSolid({
  baseURL: import.meta.env.VITE_API_URL,
  fetchOptions: {
    credentials: "omit",
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token")
      if (authToken) {
        browser.storage.local.set({ "authToken": authToken });
      }
    },
    auth: {
      type: "Bearer",
      token: async () => {
        const result = await browser.storage.local.get("authToken");
        return result.authToken || "";
      }
    }
  }
})