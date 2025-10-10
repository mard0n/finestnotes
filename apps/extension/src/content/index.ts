import { createMessageHandler } from "../messaging";
import { getTabInfo } from "../utils/libs/getTabInfo";
import { highlight, setupHighlightEventListeners } from "./highlight";
import { fetchHighlightsFromAPI, parseXPathLink } from "./highlight-on-load";
import { generateXPathLink } from "./parse-selection";
import { addToast } from "./snackbar";

// Initial load and fetch
async function initialize() {
  console.log("Initializing highlight-on-load");

  // const highlights = await loadHighlightFromStorage();
  // console.log("highlights from storage", highlights);

  // if (highlights?.length) {
  //   highlights.forEach((highlight) => {
  //     if (highlight.type === 'highlight' && highlight.link) {
  //       try {
  //         const { startNode, startOffset, endNode, endOffset } = parseXPathLink(highlight.link)
  //         highlight({ startNode, startOffset, endNode, endOffset }, highlight.id)
  //       } catch (error) {
  //         console.error("Error parsing XPath link or highlighting:", error);
  //       }
  //     }
  //   });
  // }

  const highlightsFromAPI = await fetchHighlightsFromAPI();
  console.log("highlights from API", highlightsFromAPI);

  if (highlightsFromAPI?.length) {
    highlightsFromAPI.forEach((hl) => {

        try {
          const { startNode, startOffset, endNode, endOffset } = parseXPathLink(hl.position)
          highlight({ startNode, startOffset, endNode, endOffset }, hl.id)
        } catch (error) {
          console.error("Error parsing XPath link or highlighting:", error);
        }
    });
  }

  setupHighlightEventListeners();
  // if (highlightsFromAPI?.length) {
  //   await browser.storage.local.set({ highlights: highlightsFromAPI })
  // }
}

window.addEventListener("load", () => {
  console.log("Page fully loaded (initial load).");
  initialize();
});


createMessageHandler("HIGHLIGHT_TEXT", (request) => {
  console.log("Content script: HIGHLIGHT_TEXT");

  const { startNode, startOffset, endNode, endOffset } = parseXPathLink(
    request.annotationXPathLink,
  );

  highlight(
    { startNode: startNode!, startOffset, endNode: endNode!, endOffset },
    request.highlightId,
  );

  return undefined;
});

createMessageHandler("GET_HIGHLIGHT_DATA", async () => {
  const { title, url, description } = await getTabInfo();
  const selection = window.getSelection();
  const content = selection ? selection.toString() : "";
  const link = selection ? generateXPathLink(selection, url) : "";

  return { pageTitle: title, pageURL: url, pageDescription: description, text: content, position: link};
});

createMessageHandler("GET_PAGE_DATA", async () => {
  const url = window.location.href;
  const cleanUrl = new URL(url).origin + new URL(url).pathname;
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || "";
  
  return {
    title: document.title,
    url: cleanUrl,
    description
  };
});

// Show in-page snackbar notifications from background/content
createMessageHandler("SHOW_SNACKBAR", (request) => {
  addToast({
    message: request.message,
    duration: request.duration ?? 4000,
    type: request.type ?? 'error',
  });
  return undefined;
});