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

    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Extension communication timeout after 2000ms`));
    }, 2000);

    const clearTimeoutAndResolve = (response: any) => {
      clearTimeout(timeoutId);
      resolve(response);
    };

    const clearTimeoutAndReject = (error: any) => {
      clearTimeout(timeoutId);
      reject(error);
    };

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
            clearTimeoutAndReject(new Error(chrome.runtime.lastError.message));
          } else {
            clearTimeoutAndResolve(response);
          }
        });
        return
      }
    } catch (e) {
      console.warn("Could not send directly to extension:", e);
      clearTimeoutAndReject(e);
      return;
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
            clearTimeoutAndResolve(response);
          })
          .catch((error: any) => {
            console.error("Browser sendMessage error:", error);
            clearTimeoutAndReject(error);
          });
        return;
      }
    } catch (e) {
      console.warn("Could not send directly to extension:", e);
      clearTimeoutAndReject(e);
      return;
    }

    // TODO: Fallback to using some other method to communicate with the extension
    clearTimeoutAndReject(new Error("No browser messaging API available"));
  });
}