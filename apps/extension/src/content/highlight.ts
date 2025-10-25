import { sendMessage } from "../messaging";
import { Point, SelectionRange } from "../utils/types";

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

export function highlight(selection: SelectionRange, highlightId: string) {
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

function createHighlightSpan(highlightId: string, range: Range) {
  const highlightSpan = document.createElement("mark");
  highlightSpan.style.backgroundColor = "yellow";

  const parent = range.startContainer.parentNode as HTMLElement | null;

  if (parent && parent.getAttribute("data-finest-highlight-ids")) {
    const highlightIds = parent.getAttribute("data-finest-highlight-ids");
    highlightSpan.setAttribute(
      "data-finest-highlight-ids",
      highlightIds
        ? highlightIds + ";" + highlightId.toString()
        : highlightId.toString(),
    );
  } else {
    highlightSpan.setAttribute("data-finest-highlight-ids", highlightId.toString());
  }
  highlightSpan.setAttribute("data-finest-highlight-id", highlightId.toString());
  return highlightSpan;
}

function unwrapElementAndMergeTextNodes(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;

  // Get the previous and next siblings before unwrapping
  const prevSibling = element.previousSibling;
  const nextSibling = element.nextSibling;

  // Move all child nodes out of the element
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  // Remove the now-empty element
  parent.removeChild(element);

  // Merge adjacent text nodes
  const nodesToCheck = [];

  // Check if we need to merge with previous sibling
  if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE) {
    nodesToCheck.push(prevSibling);
  }

  // Check if we need to merge with next sibling
  if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
    nodesToCheck.push(nextSibling);
  }

  // Merge consecutive text nodes
  nodesToCheck.forEach(node => {
    let current = node;
    while (current && current.nextSibling &&
      current.nodeType === Node.TEXT_NODE &&
      current.nextSibling.nodeType === Node.TEXT_NODE) {
      const next = current.nextSibling;
      current.nodeValue = (current.nodeValue || '') + (next.nodeValue || '');
      parent.removeChild(next);
    }
  });
}

export function setupHighlightEventListeners() {
  let activeHighlightId: string | null = null;
  let deleteButton: HTMLDivElement | null = null;
  let hoverTimeout: number | null = null;

  // Create the delete button once and reuse it
  function createDeleteButton() {
    if (!deleteButton) {
      deleteButton = document.createElement("div");
      deleteButton.innerHTML = "&times;";
      deleteButton.className = "finest-highlight-delete-button";
      deleteButton.style.display = "none"; // Initially hidden
      document.body.appendChild(deleteButton);

      deleteButton.addEventListener("click", handleDelete);

      // Keep hover state when hovering over the delete button
      deleteButton.addEventListener("mouseover", () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
      });
    }
  }

  document.body.addEventListener("mouseover", (e) => {
    const target = e.target as HTMLElement;

    if (target.tagName !== "MARK" || !target.dataset.finestHighlightId) {
      return;
    }

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    const highlightIds = (target.dataset.finestHighlightIds || "").split(";");
    const highlightId = highlightIds[highlightIds.length - 1];

    if (activeHighlightId === highlightId) {
      return;
    }

    // A small delay to prevent flickering when moving between highlight parts
    setTimeout(() => {
      if (activeHighlightId !== highlightId) {
        clearHoverState();
      }
      setActiveHighlight(highlightId);
    }, 50);
  });

  document.body.addEventListener("mouseout", (e) => {
    const relatedTarget = e.relatedTarget as HTMLElement;

    // If we are moving out to something that is not part of a highlight, clear the state.
    if (
      !relatedTarget ||
      (!relatedTarget.closest("mark[data-finest-highlight-ids]") &&
        !relatedTarget.closest(".finest-highlight-delete-button"))
    ) {
      hoverTimeout = window.setTimeout(() => {
        clearHoverState();
      }, 100);
    }
  });

  function setActiveHighlight(highlightId: string) {
    activeHighlightId = highlightId;

    // Create button if it doesn't exist
    createDeleteButton();

    const allHighlightParts = document.querySelectorAll(
      `mark[data-finest-highlight-ids*="${highlightId}"]`,
    );
    allHighlightParts.forEach((part) => {
      part.classList.add("finest-highlight-hover");
    });

    const firstPart = allHighlightParts[0] as HTMLElement;
    if (firstPart && deleteButton) {
      // Insert temporary element at the beginning of the first highlight part
      const tempElement = document.createElement("span");
      tempElement.style.position = "absolute";
      tempElement.style.width = "0";
      tempElement.style.height = "0";
      tempElement.style.visibility = "hidden";

      // Insert at the very beginning of the highlight
      firstPart.insertBefore(tempElement, firstPart.firstChild);

      const rect = tempElement.getBoundingClientRect();

      // Update button position and data
      deleteButton.style.left = `${window.scrollX + rect.left}px`;
      deleteButton.style.top = `${window.scrollY + rect.top}px`;
      deleteButton.dataset.highlightId = highlightId;
      deleteButton.style.display = "flex"; // Show the button

      // Remove the temporary element
      tempElement.remove();
    }
  }

  function clearHoverState() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    if (activeHighlightId) {
      const allHighlightParts = document.querySelectorAll(
        `mark[data-finest-highlight*="${activeHighlightId}"]`,
      );
      allHighlightParts.forEach((part) => {
        part.classList.remove("finest-highlight-hover");
      });
    }

    if (deleteButton) {
      deleteButton.style.display = "none"; // Hide the button
    }

    activeHighlightId = null;
  }

  async function handleDelete(e: MouseEvent) {
    const button = e.target as HTMLButtonElement;
    const highlightIdToDelete = button.dataset.highlightId;

    if (!highlightIdToDelete) return;

    const allHighlightParts = document.querySelectorAll(
      `mark[data-finest-highlight-id="${highlightIdToDelete}"]`,
    );

    allHighlightParts.forEach((part) => {
      const parent = part.parentNode;
      if (!parent) return;

      const currentIds = (part.getAttribute("data-finest-highlight-ids") || "")
        .split(";")
        .filter((id) => id);
      const newIds = currentIds.filter((id) => id !== highlightIdToDelete);

      part.setAttribute("data-finest-highlight-ids", newIds.join(";"));

      unwrapElementAndMergeTextNodes(part);
    });

    // TODO: Send message to background to delete annotation
    console.log(`Deleted highlight ${highlightIdToDelete}`);

    await sendMessage("deleteHighlight", { highlightId: highlightIdToDelete });


    clearHoverState();
  }

  // Inject CSS
  const style = document.createElement("style");
  style.textContent = `
    .finest-highlight-hover {
      background-color: #ffc107 !important;
      cursor: pointer;
    }
    .finest-highlight-delete-button {
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid #ccc;
      background-color: white;
      color: #333;
      font-size: 14px;
      line-height: 18px;
      text-align: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 0 5px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    }
  `;
  document.head.appendChild(style);
}