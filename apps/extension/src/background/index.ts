import browser from "webextension-polyfill";
import { client } from "../api/config";
import { createMessageHandler, sendMessageFromServiceWorker } from "../messaging/index";
import { getCleanUrl } from "../utils/libs/getCleanURL";
import { SystemError, UserError } from "../utils/errors";

console.log("Hello from the background!");


browser.commands.onCommand.addListener(async (command, tab) => {
  if (command === "highlight") {

    if (!tab?.id) { return }

    try {
      const response = await sendMessageFromServiceWorker(tab.id, { type: "GET_HIGHLIGHT_DATA" })

      const res = await client.api.highlight.$post({ json: response });
      console.log("res", res);
      if (!res.ok) {
        throw new SystemError("Failed to save highlight: " + res.statusText);
      }
      const data = await res.json();

      await sendMessageFromServiceWorker(tab.id, { type: "HIGHLIGHT_TEXT", data: { highlightId: data.id, annotationXPathLink: response.link } });

    } catch (error) {
      console.error("Error while highlighting:", error);
      if (error instanceof UserError) {
        const message = (error.message ? error.message : String(error)) || "Unknown error";
        await sendMessageFromServiceWorker(tab.id, {
          type: "SHOW_SNACKBAR",
          data: { message, duration: 5000 }
        });
      } else {
        console.log("Error while highlighting:", error);
      }
    }
  }
});

createMessageHandler("FETCH_ANNOTATIONS", async (request) => {
  const cleanUrl = getCleanUrl(request.currentURL)
  const res = await client.api.annotations.source.$get({
    query: {
      url: cleanUrl
    }
  })

  if (!res.ok) {
    throw new SystemError("Failed to fetch annotations: " + res.statusText)
  }
  const data = await res.json()
  return data
})

createMessageHandler("DELETE_HIGHLIGHT", async (request) => {
  const res = await client.api.highlight[":id"].$delete({ param: { id: request.highlightId.toString() } })
  if (!res.ok) {
    throw new UserError("Failed to delete highlight: " + res.statusText)
  }
  return undefined
})