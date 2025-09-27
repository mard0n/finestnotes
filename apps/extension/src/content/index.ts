import { createMessageHandler } from "../messaging";
import { highlight, setupHighlightEventListeners } from "./highlight";
import { fetchAnnotationsFromAPI, parseXPathLink } from "./highlight-on-load";
import { generateXPathLink } from "./parse-selection";
import { addToast } from "./snackbar";

// Initial load and fetch
async function initialize() {
  console.log("Initializing highlight-on-load");

  // const annotations = await loadAnnotationFromStorage();
  // console.log("annotations from storage", annotations);

  // if (annotations?.length) {
  //   annotations.forEach((annotation) => {
  //     if (annotation.type === 'highlight' && annotation.link) {
  //       try {
  //         const { startNode, startOffset, endNode, endOffset } = parseXPathLink(annotation.link)
  //         highlight({ startNode, startOffset, endNode, endOffset }, annotation.id)
  //       } catch (error) {
  //         console.error("Error parsing XPath link or highlighting:", error);
  //       }
  //     }
  //   });
  // }

  const annotationsFromAPI = await fetchAnnotationsFromAPI();
  console.log("annotations from API", annotationsFromAPI);

  if (annotationsFromAPI?.length) {
    annotationsFromAPI.forEach((annotation) => {
      if (annotation.type === 'highlight' && annotation.link) {
        try {
          const { startNode, startOffset, endNode, endOffset } = parseXPathLink(annotation.link)
          highlight({ startNode, startOffset, endNode, endOffset }, annotation.id)
        } catch (error) {
          console.error("Error parsing XPath link or highlighting:", error);
        }
      }
    });
  }

  setupHighlightEventListeners();
  // if (annotationsFromAPI?.length) {
  //   await browser.storage.local.set({ annotations: annotationsFromAPI })
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

createMessageHandler("GET_HIGHLIGHT_DATA", () => {
  const url = window.location.href;
  const cleanUrl = new URL(url).origin + new URL(url).pathname;
  const sourceTitle = document.title;
  const sourceLink = cleanUrl;
  const selection = window.getSelection();
  const content = selection ? selection.toString() : "";
  const link = selection ? generateXPathLink(selection, cleanUrl) : "";
  console.log("Highlight data:", { sourceTitle, sourceLink, content, link });
  return { sourceTitle, sourceLink, content, link };
});

// Show in-page snackbar notifications from background/content
createMessageHandler("SHOW_SNACKBAR", (request) => {
  addToast({
    message: request.message,
    duration: request.duration ?? 4000,
  });
  return undefined;
});