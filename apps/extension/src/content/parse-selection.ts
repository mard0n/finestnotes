import getXPath from "get-xpath";
import { createMessageHandler } from "../messaging/index";
import { SystemError } from "../utils/errors";
import { Point } from "../utils/types";

console.log("Hello from parse-selection");

function getStablePointContainer({ node, offset }: Point): Point {
  let currentNode = node;

  // Find the nearest ancestor that's not a <mark>
  let container = currentNode;
  while (
    (container &&
      container.nodeType === Node.ELEMENT_NODE &&
      container.nodeName.toLowerCase() === "mark") ||
    container.nodeType === Node.TEXT_NODE
  ) {
    if (container.parentNode) {
      container = container.parentNode;
    } else {
      break;
    }
  }
  if (!container) {
    throw new Error("No stable container found");
  }

  // If starting inside a text node, compute absolute offset relative to container
  function getAbsoluteOffset(
    root: Node,
    targetNode: Node,
    targetOffset: number,
  ): number {
    let charCount = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      if (textNode === targetNode) {
        return charCount + targetOffset;
      }
      charCount += textNode.nodeValue!.length;
    }
    return charCount;
  }

  // We want the container to be the nearest non-mark ancestor element
  return {
    node: container,
    offset: getAbsoluteOffset(container, node, offset),
  };
}

function isBefore(pointA: Point, pointB: Point): boolean {
  if (pointA.node === pointB.node) {
    return pointA.offset <= pointB.offset;
  }

  const pos = pointA.node.compareDocumentPosition(pointB.node);
  return !!(pos & Node.DOCUMENT_POSITION_FOLLOWING);
}

function generateXPathLink(selection: Selection, baseURL: string): string {
  if (selection.rangeCount === 0) {
    throw new SystemError("No selection range available");
  }
  let startContainer = getStablePointContainer({
    node: selection.anchorNode!,
    offset: selection.anchorOffset,
  });
  let endContainer = getStablePointContainer({
    node: selection.focusNode!,
    offset: selection.focusOffset,
  });
  console.log("startContainer", startContainer);
  console.log("endContainer", endContainer);
  if (isBefore(endContainer, startContainer)) {
    [startContainer, endContainer] = [endContainer, startContainer];
  }

  const [
    { node: startNode, offset: startOffset },
    { node: endNode, offset: endOffset },
  ] = [startContainer, endContainer];

  const startXPath = getXPath(startNode);
  const endXPath = getXPath(endNode);

  if (!startXPath || !endXPath) {
    throw new SystemError("Could not generate XPath for the selection");
  }

  const xpathLink = `${baseURL}?xpath=(startnode=${startXPath},startoffset=${startOffset},endnode=${endXPath},endoffset=${endOffset})`;
  return xpathLink;
}

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
