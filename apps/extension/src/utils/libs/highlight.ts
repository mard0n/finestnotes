function getTextNodesInBetween({ startNode, startOffset, endNode, endOffset }: { startNode: Node, startOffset: number, endNode: Node, endOffset: number }): Node[] {
  const range = document.createRange();

  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node === startNode || node === endNode) return NodeFilter.FILTER_REJECT;

        // Only include nodes that intersect the range
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;

        // Exclude nodes that are only whitespace/newlines
        console.log('/^\s*$/.test(node.nodeValue)', /^\s*$/.test(node.nodeValue!));

        if (!node.nodeValue || /^\s*$/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }

  return nodes;
}

export function highlight({ startNode, startOffset, endNode, endOffset, highlightId }: { startNode: Node, startOffset: number, endNode: Node, endOffset: number, highlightId: number }) {
  // Handle case where selection is within a single text node
  if (startNode === endNode && startNode.nodeType === Node.TEXT_NODE) {
    const singleRange = document.createRange();
    singleRange.setStart(startNode, startOffset);
    singleRange.setEnd(endNode, endOffset);

    const highlightSpan = createHighlightSpan(highlightId, singleRange)
    singleRange.surroundContents(highlightSpan);

    return;
  }

  // Handle case where selection spans multiple text nodes
  // Highlight start node
  if (startNode.nodeType === Node.TEXT_NODE) {
    const startRange = document.createRange();
    startRange.setStart(startNode, startOffset);
    startRange.setEnd(startNode, (startNode as Text).length);

    const highlightSpan = createHighlightSpan(highlightId, startRange)
    startRange.surroundContents(highlightSpan);
  }

  // Highlight end node
  if (endNode.nodeType === Node.TEXT_NODE) {
    const endRange = document.createRange();
    endRange.setStart(endNode, 0);
    endRange.setEnd(endNode, endOffset);

    const highlightSpan = createHighlightSpan(highlightId, endRange)
    endRange.surroundContents(highlightSpan);
  }

  const textNodes = getTextNodesInBetween({ startNode, startOffset, endNode, endOffset })

  // Highlight all fully selected text nodes in between
  textNodes.forEach(node => {
    const range = document.createRange();
    range.selectNodeContents(node);

    const highlightSpan = createHighlightSpan(highlightId, range)
    range.surroundContents(highlightSpan);
  });
}

function createHighlightSpan(highlightId: number, range: Range): HTMLSpanElement {
  const highlightSpan = document.createElement("mark");
  highlightSpan.style.backgroundColor = "yellow";
  
  const parent = range.startContainer.parentNode as HTMLElement

  if (parent && parent.getAttribute("data-finest-highlight")) {
    const highlightIds = parent.getAttribute("data-finest-highlight");
    highlightSpan.setAttribute("data-finest-highlight", highlightIds ? highlightIds + ';' + highlightId.toString() : highlightId.toString());
  } else {
    highlightSpan.setAttribute("data-finest-highlight", highlightId.toString());
  }
  return highlightSpan
}