import browser from "webextension-polyfill";
import { client } from "./api/config";
import { sendMessage } from "./messaging";

console.log("Hello from the background!");

browser.commands.onCommand.addListener(async (command, tab) => {
  if (command === "highlight") {

    if (!tab?.id) { return }

    try {
      const response = await sendMessage(tab.id, { type: "GET_HIGHLIGHT_DATA" });
      console.log("response", response);
      if (response?.success) {
        await client.api.highlight.$post({ json: response.data })
      } else {
        console.error("Failed to get highlight data:", response.error);
        throw new Error("Failed to get highlight data: " + response.error)
      }

      await sendMessage(tab.id, { type: "HIGHLIGHT_TEXT" });
      
    } catch (error) {
      console.error("Error sending message to content script:", error);
    }
  }
});