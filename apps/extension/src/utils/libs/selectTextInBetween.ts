function getTextNodesInSelection(selection: Selection): Node[] {
  if (!selection.rangeCount) return [];

  const range = selection.getRangeAt(0);

  const start = range.startContainer;
  const end = range.endContainer;

  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node === start || node === end) return NodeFilter.FILTER_REJECT;

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

export function selectTextInBetween(selection: Selection) {
  if (selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  const endNode = range.endContainer;

  // Handle case where selection is within a single text node
  if (startNode === endNode && startNode.nodeType === Node.TEXT_NODE) {
    const highlightSpan = createHighlightSpan()

    const singleRange = document.createRange();
    singleRange.setStart(startNode, range.startOffset);
    singleRange.setEnd(endNode, range.endOffset);

    const parent = startNode.parentNode;
    if (parent) {
      singleRange.surroundContents(highlightSpan);
    }

    selection.removeAllRanges();
    return;
  }

  const textNodes = getTextNodesInSelection(selection)

  // Handle case where selection spans multiple text nodes
  // Highlight start node
  if (startNode.nodeType === Node.TEXT_NODE) {
    const highlightSpan = createHighlightSpan()

    const startRange = document.createRange();
    startRange.setStart(startNode, range.startOffset);
    startRange.setEnd(startNode, (startNode as Text).length);

    const parent = startNode.parentNode;
    if (parent) {
      startRange.surroundContents(highlightSpan);
    }
  }

  // Highlight end node
  if (endNode.nodeType === Node.TEXT_NODE) {
    const highlightSpan = createHighlightSpan()

    const endRange = document.createRange();
    endRange.setStart(endNode, 0);
    endRange.setEnd(endNode, range.endOffset);

    const parent = endNode.parentNode;
    if (parent) {
      endRange.surroundContents(highlightSpan);
    }
  }

  // Highlight all fully selected text nodes in between
  textNodes.forEach(node => {
    const highlightSpan = createHighlightSpan()

    const range = document.createRange();
    range.selectNodeContents(node);

    const parent = node.parentNode;
    if (parent) {
      range.surroundContents(highlightSpan);
    }
  });

  selection.removeAllRanges();
}

function createHighlightSpan(): HTMLSpanElement {
  const highlightSpan = document.createElement("span");
  highlightSpan.style.backgroundColor = "yellow";
  return highlightSpan
}