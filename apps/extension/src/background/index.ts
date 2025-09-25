import browser from "webextension-polyfill";
import { client } from "../api/config";
import { createMessageHandler, sendMessageFromServiceWorker } from "../messaging/index";
import { getCleanUrl } from "../utils/libs/getCleanURL";
import { SystemError } from "../utils/errors";

console.log("Hello from the background!");

browser.commands.onCommand.addListener(async (command, tab) => {
  if (command === "highlight") {

    if (!tab?.id) { return }

    try {
      const response = await sendMessageFromServiceWorker(tab.id, { type: "GET_HIGHLIGHT_DATA" })

      const res = await client.api.highlight.$post({ json: response });
      console.log("res", res);
      if (!res.ok) { throw new SystemError("Failed to save highlight: " + res.statusText) }
      const data = await res.json()

      await sendMessageFromServiceWorker(tab.id, { type: "HIGHLIGHT_TEXT", data: { highlightId: data.id } });

    } catch (error) {
      console.error("Error sending message to content script:", error);
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