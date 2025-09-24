import getXPath from "get-xpath";

export function generateXPathLink(selection: Selection, baseURL: string): string {
  if (selection.rangeCount === 0) {
    throw new Error("No selection range available");
  }

  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;


  const startXPath = getXPath(startContainer);
  const endXPath = getXPath(endContainer);

  if (!startXPath || !endXPath) {
    throw new Error("Could not generate XPath for the selection");
  }

  const xpathLink = `${baseURL}?xpath(start=${startXPath},startoffset=${startOffset},end=${endXPath},endoffset=${endOffset})`;
  return xpathLink;
}

export function parseXPathLink(xpathLink: string): { startElement: Element; startOffset: number; endElement: Element; endOffset: number } | null {
  const url = new URL(xpathLink);
  const xpathParam = url.searchParams.get("xpath");
  if (!xpathParam) {
    return null;
  }

  const match = xpathParam.match(/start=(.*),startoffset=(\d+),end=(.*),endoffset=(\d+)/);
  if (!match) {
    return null;
  }

  const [, startXPath, startOffsetStr, endXPath, endOffsetStr] = match;

  const startElement = document.evaluate(startXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  const endElement = document.evaluate(endXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (!startElement || !endElement) {
    return null;
  }

  return {
    startElement: startElement as Element,
    startOffset: parseInt(startOffsetStr, 10),
    endElement: endElement as Element,
    endOffset: parseInt(endOffsetStr, 10),
  };
}