import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL, // Use the API URL from env
  fetchOptions: {
    credentials: import.meta.env.PROD ? 'same-origin' : 'include', // Required for sending cookies cross-origin
  }
})

export function sendAuthToExtension(token: string, extensionId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!token || !extensionId) {
      reject(new Error("Missing token or extensionId"));
      return;
    }

    // console.log("Sending token to extension:", extensionId);

    try {
      // @ts-ignore
      if (typeof chrome !== "undefined" && chrome?.runtime?.sendMessage) {
        // @ts-ignore
        chrome.runtime.sendMessage(extensionId, {
          type: "authToken",
          token,
        }, (response: any) => {
          // @ts-ignore
          if (chrome.runtime.lastError) {
            // @ts-ignore
            console.error("Chrome sendMessage error:", chrome.runtime.lastError);
            // @ts-ignore
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            // console.log("Token sent successfully via Chrome API:", response);
            resolve(response);
          }
        });
        return
      }
    } catch (e) {
      console.warn("Could not send directly to extension:", e);
      reject(e);
    }


    try {
      // For safari. Unfortunately, Firefox doesn't support runtime messaging to extensions
      // @ts-ignore
      if (typeof browser !== "undefined" && browser?.runtime?.sendMessage) {
        // @ts-ignore
        browser.runtime.sendMessage(extensionId, {
          type: "authToken",
          token,
        })
          .then((response: any) => {
            // console.log("Token sent successfully via browser API:", response);
            resolve(response);
          })
          .catch((error: any) => {
            console.error("Browser sendMessage error:", error);
            reject(error);
          });
        return;
      }
    } catch (e) {
      console.warn("Could not send directly to extension:", e);
      reject(e);
    }

    // TODO: Fallback to using some other method to communicate with the extension

  });
}