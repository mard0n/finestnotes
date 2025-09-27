import { sendMessageFromContentScript } from "../messaging/index";
import { AnnotationsResType } from "../api/config";
import { getCleanUrl } from "../utils/libs/getCleanURL";
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

// async function loadAnnotationFromStorage(): Promise<AnnotationsResType | null> {
//   const { annotations } = await browser.storage.local.get('annotations') as Record<string, AnnotationsResType>
//   console.log("Loaded annotations from storage:", annotations);

//   if (!annotations || annotations.length === 0) {
//     console.log('No annotations found in storage.');
//     return null
//   }

//   return annotations
// }

export async function fetchAnnotationsFromAPI(): Promise<AnnotationsResType | null> {
  console.log("fetching annotations");
  const cleanUrl = getCleanUrl(window.location.href);

  try {
    return await sendMessageFromContentScript({
      type: "FETCH_ANNOTATIONS",
      data: { currentURL: cleanUrl },
    });
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return null;
  }
}

// // Listen for storage changes and rehighlight
// browser.storage.onChanged.addListener((changes, areaName) => {
//   if (areaName === 'local' && changes.annotations) {
//     console.log('Annotations updated in storage, rehighlighting...')
//     const highlightedElements = document.querySelectorAll('mark[data-finest-highlight]');
//     const highlightedAnnotationIds = new Set<string>();
//     highlightedElements.forEach(el => {
//       const ids = el.getAttribute('data-finest-highlight');
//       if (ids) {
//         ids.split(';').forEach(id => highlightedAnnotationIds.add(id));
//       }
//     });
//     (changes.annotations.newValue as AnnotationsResType)?.forEach((annotation) => {
//       if (annotation.type === 'highlight' && annotation.link) {
//         if (highlightedAnnotationIds.has(annotation.id.toString())) {
//           // Already highlighted
//           return;
//         }
//         try {
//           const { startNode, startOffset, endNode, endOffset } = parseXPathLink(annotation.link)
//           highlight({ startNode, startOffset, endNode, endOffset }, annotation.id)
//         } catch (error) {
//           console.error("Error parsing XPath link or highlighting:", error);
//         }
//       }
//     });
//   }
// });
