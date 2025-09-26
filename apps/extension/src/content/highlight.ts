import { createMessageHandler } from "../messaging";
import { Point, SelectionRange } from "../utils/types";
import { parseXPathLink } from "./highlight-on-load";

console.log("Hello from highlight");

function getPointFromStablePointContainer({ node, offset }: Point): Point {
  let currentNode = node;
  let currentOffset = offset;

  const walker = document.createTreeWalker(
    currentNode,
    NodeFilter.SHOW_TEXT,
    null,
  );
  let textNode = walker.nextNode();
  while (textNode) {
    const textLength = textNode.nodeValue!.length;
    if (currentOffset <= textLength) {
      return { node: textNode, offset: currentOffset };
    }
    currentOffset -= textLength;
    textNode = walker.nextNode();
  }

  // Fallback to the container itself if no text nodes found
  return { node: node, offset: node.nodeValue!.length };
}

function getTextNodesInBetween({
  startNode,
  startOffset,
  endNode,
  endOffset,
}: SelectionRange): Node[] {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node === startNode || node === endNode)
          return NodeFilter.FILTER_REJECT;

        // Only include nodes that intersect the range
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;

        // Exclude nodes that are only whitespace/newlines
        if (!node.nodeValue || /^\s*$/.test(node.nodeValue))
          return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  return nodes;
}

export function highlight(selection: SelectionRange, highlightId: number) {
  const { node: startNode, offset: startOffset } =
    getPointFromStablePointContainer({
      node: selection.startNode,
      offset: selection.startOffset,
    });
  const { node: endNode, offset: endOffset } = getPointFromStablePointContainer(
    { node: selection.endNode, offset: selection.endOffset },
  );

  console.log("Normalized Selection:", {
    startNode,
    startOffset,
    endNode,
    endOffset,
  });

  // Handle case where selection is within a single text node
  if (startNode === endNode) {
    const singleRange = document.createRange();
    singleRange.setStart(startNode, startOffset);
    singleRange.setEnd(endNode, endOffset);

    const highlightSpan = createHighlightSpan(highlightId, singleRange);
    singleRange.surroundContents(highlightSpan);

    return;
  }

  // Handle case where selection spans multiple text nodes

  // This function must be before highlighting start and end nodes to avoid interference
  const textNodes = getTextNodesInBetween({
    startNode,
    startOffset,
    endNode,
    endOffset,
  });

  // Highlight start node
  if (startNode.nodeType === Node.TEXT_NODE) {
    const startRange = document.createRange();
    startRange.setStart(startNode, startOffset);
    startRange.setEnd(startNode, startNode.nodeValue!.length);

    const highlightSpan = createHighlightSpan(highlightId, startRange);
    startRange.surroundContents(highlightSpan);
  }

  // Highlight end node
  if (endNode.nodeType === Node.TEXT_NODE) {
    const endRange = document.createRange();
    endRange.setStart(endNode, 0);
    endRange.setEnd(endNode, endOffset);

    const highlightSpan = createHighlightSpan(highlightId, endRange);
    endRange.surroundContents(highlightSpan);
  }

  // Highlight all fully selected text nodes in between
  textNodes.forEach((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);

    const highlightSpan = createHighlightSpan(highlightId, range);
    range.surroundContents(highlightSpan);
  });
}

function createHighlightSpan(highlightId: number, range: Range) {
  const highlightSpan = document.createElement("mark");
  highlightSpan.style.backgroundColor = "yellow";

  const parent = range.startContainer.parentNode as HTMLElement | null;

  if (parent && parent.getAttribute("data-finest-highlight")) {
    const highlightIds = parent.getAttribute("data-finest-highlight");
    highlightSpan.setAttribute(
      "data-finest-highlight",
      highlightIds
        ? highlightIds + ";" + highlightId.toString()
        : highlightId.toString(),
    );
  } else {
    highlightSpan.setAttribute("data-finest-highlight", highlightId.toString());
  }
  return highlightSpan;
}

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
