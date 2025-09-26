import { generateXPathLink } from "../utils/libs/getXPath";
import { createMessageHandler } from "../messaging/index";
import { highlight } from "../utils/libs/highlight";
import { SystemError } from "../utils/errors";

console.log("Hello from the content script!");

createMessageHandler("GET_HIGHLIGHT_DATA", () => {
  console.log("Content script: GET_HIGHLIGHT_DATA");
  const url = window.location.href
  const cleanUrl = new URL(url).origin + new URL(url).pathname;
  const sourceTitle = document.title;
  const sourceLink = cleanUrl;
  const selection = window.getSelection();
  const content = selection ? selection.toString() : '';
  const link = selection ? generateXPathLink(selection, cleanUrl) : '';
  console.log("Highlight data:", { sourceTitle, sourceLink, content, link });
  return { sourceTitle, sourceLink, content, link };
});


createMessageHandler("HIGHLIGHT_TEXT", (request) => {
  console.log("Content script: HIGHLIGHT_TEXT");
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    console.warn("No text selected to highlight.");
    throw new SystemError("No text selected");
  }

  const { anchorNode: startNode, anchorOffset: startOffset, focusNode: endNode, focusOffset: endOffset } = selection

  highlight({ startNode: startNode!, startOffset, endNode: endNode!, endOffset, highlightId: request.highlightId });

  return undefined
});
