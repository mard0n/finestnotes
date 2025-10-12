import { SystemError } from "../utils/errors";
import { SelectionRange } from "../utils/types";

console.log("Hello from highlight-on-load");

export function parseXPathLink(parseXPathLink: string): SelectionRange {
  const url = new URL(parseXPathLink);
  const xpathParam = url.searchParams.get("xpath");
  if (!xpathParam) {
    throw new SystemError("No xpath in the url");
  }

  const match = xpathParam.match(
    /startnode=(.*),startoffset=(\d+),endnode=(.*),endoffset=(\d+)/,
  );
  if (!match) {
    throw new SystemError(
      "Couldn't locate startnode, startoffset, endnode, endoffet in the url",
    );
  }

  const [, startXPath, startOffsetStr, endXPath, endOffsetStr] = match;

  const startElement = document.evaluate(
    startXPath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  const endElement = document.evaluate(
    endXPath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;

  if (!startElement || !endElement) {
    throw new SystemError(
      "Couldn't locate startElement, endElement in the document",
    );
  }

  return {
    startNode: startElement,
    startOffset: parseInt(startOffsetStr, 10),
    endNode: endElement,
    endOffset: parseInt(endOffsetStr, 10),
  };
}

// // Listen for storage changes and rehighlight
// browser.storage.onChanged.addListener((changes, areaName) => {
//   if (areaName === 'local' && changes.highlights) {
//     console.log('Highlights updated in storage, rehighlighting...')
//     const highlightedElements = document.querySelectorAll('mark[data-finest-highlight]');
//     const highlightedAnnotationIds = new Set<string>();
//     highlightedElements.forEach(el => {
//       const ids = el.getAttribute('data-finest-highlight');
//       if (ids) {
//         ids.split(';').forEach(id => highlightedAnnotationIds.add(id));
//       }
//     });
//     (changes.highlights.newValue as HighlightResType)?.forEach((highlight) => {
//       if (highlight.type === 'highlight' && highlight.link) {
//         if (highlightedAnnotationIds.has(highlight.id.toString())) {
//           // Already highlighted
//           return;
//         }
//         try {
//           const { startNode, startOffset, endNode, endOffset } = parseXPathLink(highlight.link)
//           highlight({ startNode, startOffset, endNode, endOffset }, highlight.id)
//         } catch (error) {
//           console.error("Error parsing XPath link or highlighting:", error);
//         }
//       }
//     });
//   }
// });
