import { generateXPathLink } from "./utils/libs/getXPath";
import { createMessageHandler } from "./messaging";

console.log("Hello from the content script!");

createMessageHandler("GET_HIGHLIGHT_DATA", () => {
  console.log("Highlight message received in content script via handler");
  try {
    const url = window.location.href
    const cleanUrl = new URL(url).origin + new URL(url).pathname;
    const sourceTitle = document.title;
    const sourceLink = cleanUrl;
    const selection = window.getSelection();
    const content = selection ? selection.toString() : '';
    const link = selection ? generateXPathLink(selection, cleanUrl) : '';
    console.log("success", {sourceTitle, sourceLink, content, link});;
    return { success: true, data: {sourceTitle, sourceLink, content, link} };
  } catch (error) {
    console.error("Error generating highlight data:", error);
    return { success: false, error: (error as Error).message };
  }
});