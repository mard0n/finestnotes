import browser from "webextension-polyfill";
import { sendMessageFromContentScript } from "../messaging/index";
import { highlight } from "../utils/libs/highlight";
import { AnnotationsResType } from "../api/config";
import { parseXPathLink } from "../utils/libs/getXPath";
import { getCleanUrl } from "../utils/libs/getCleanURL";

async function loadAnnotationFromStorage(): Promise<AnnotationsResType | null> {
  const { annotations } = await browser.storage.local.get('annotations') as Record<string, AnnotationsResType>
  console.log("Loaded annotations from storage:", annotations);

  if (!annotations || annotations.length === 0) {
    console.log('No annotations found in storage.');
    return null
  }

  return annotations
}

async function fetchAnnotationsFromAPI(): Promise<AnnotationsResType | null> {
  console.log("fetching annotations");
  const cleanUrl = getCleanUrl(window.location.href)

  try {
    return await sendMessageFromContentScript({ type: "FETCH_ANNOTATIONS", data: { currentURL: cleanUrl } })
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return null
  }
}

// Listen for storage changes and rehighlight
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.annotations) {
    console.log('Annotations updated in storage, rehighlighting...')
    const highlightedElements = document.querySelectorAll('mark[data-finest-highlight]');
    const highlightedAnnotationIds = new Set<string>();
    highlightedElements.forEach(el => {
      const ids = el.getAttribute('data-finest-highlight');
      if (ids) {
        ids.split(';').forEach(id => highlightedAnnotationIds.add(id));
      }
    });
    (changes.annotations.newValue as AnnotationsResType)?.forEach((annotation) => {
      if (annotation.type === 'highlight' && annotation.link) {
        if (highlightedAnnotationIds.has(annotation.id.toString())) {
          // Already highlighted
          return;
        }
        try {
          const {startElement: startNode, startOffset, endElement: endNode, endOffset} = parseXPathLink(annotation.link)
          highlight({startNode, startOffset, endNode, endOffset, highlightId: annotation.id})
        } catch (error) {
          console.error("Error parsing XPath link or highlighting:", error);
        }
      }
    });

  }
});

// Initial load and fetch
async function initialize() {
  console.log("Initializing highlight-on-load");

  const annotations = await loadAnnotationFromStorage();
  console.log("annotations from storage", annotations);

  if (annotations?.length) {
    annotations.forEach((annotation) => {
      if (annotation.type === 'highlight' && annotation.link) {
        try {
          const {startElement: startNode, startOffset, endElement: endNode, endOffset} = parseXPathLink(annotation.link)
          highlight({startNode, startOffset, endNode, endOffset, highlightId: annotation.id})
        } catch (error) {
          console.error("Error parsing XPath link or highlighting:", error);
        }
      }
    });
  }

  const annotationsFromAPI = await fetchAnnotationsFromAPI();
  console.log("annotations from API", annotations);

  if (annotationsFromAPI?.length) {
    await browser.storage.local.set({ annotations: annotationsFromAPI })
  }
}

initialize();
