import { onMessage, sendMessage } from "../messaging";
import { getTabInfo } from "../utils/libs/getTabInfo";
import { highlight, setupHighlightEventListeners } from "./highlight";
import { parseXPathLink } from "./highlight-on-load";
import { generateXPathLink } from "./parse-selection";
import { addToast } from "./snackbar";

// Initial load and fetch
async function initialize() {
  const tabInfo = await getTabInfo();
  const highlights = await sendMessage("fetchHighlights", { url: tabInfo.url });
  

  if (highlights?.length) {
    highlights.forEach((hl) => {

      try {
        const { startNode, startOffset, endNode, endOffset } = parseXPathLink(hl.position)
        highlight({ startNode, startOffset, endNode, endOffset }, hl.id)
      } catch (error) {
        console.error("Error parsing XPath link or highlighting:", error);
      }
    });

    setupHighlightEventListeners();
  }
}

window.addEventListener("load", () => {
  initialize();
});


onMessage("getSelectionData", async () => {
  const selection = window.getSelection();
  const content = selection ? selection.toString() : "";
  const { title, url, description } = await getTabInfo();
  const link = selection ? generateXPathLink(selection, url) : "";

  return { pageTitle: title, pageURL: url, pageDescription: description, text: content, position: link };
});

onMessage("highlightText", async (params) => {
  const { highlightId, annotationXPathLink } = params.data
  const { startNode, startOffset, endNode, endOffset } = parseXPathLink(annotationXPathLink);

  highlight(
    { startNode: startNode!, startOffset, endNode: endNode!, endOffset },
    highlightId,
  );

  return undefined;
});

onMessage("showSnackbar", (request) => {
  const { message, duration, type } = request.data;
  addToast({
    message,
    duration: duration ?? 4000,
    type: type ?? 'error',
  });
  return undefined;
});

onMessage("getTabInfo", async () => {
  const url = window.location.href;
  const cleanUrl = new URL(url).origin + new URL(url).pathname;
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || "";

  return {
    title: document.title,
    url: cleanUrl,
    description
  };
})
