import getXPath from "get-xpath";
import { SystemError } from "../errors";

export function generateXPathLink(selection: Selection, baseURL: string): string {
  if (selection.rangeCount === 0) {
    throw new SystemError("No selection range available");
  }

  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;


  const startXPath = getXPath(startContainer);
  const endXPath = getXPath(endContainer);

  if (!startXPath || !endXPath) {
    throw new SystemError("Could not generate XPath for the selection");
  }

  const xpathLink = `${baseURL}?xpath=(startnode=${startXPath},startoffset=${startOffset},endnode=${endXPath},endoffset=${endOffset})`;
  return xpathLink;
}

export function parseXPathLink(xpathLink: string): { startElement: Element; startOffset: number; endElement: Element; endOffset: number } {
  const url = new URL(xpathLink);
  const xpathParam = url.searchParams.get("xpath");
  if (!xpathParam) {
    throw new SystemError("No xpath in the url");
  }

  const match = xpathParam.match(/startnode=(.*),startoffset=(\d+),endnode=(.*),endoffset=(\d+)/);
  if (!match) {
    throw new SystemError("Couldn't locate startnode, startoffset, endnode, endoffet in the url");
  }

  const [, startXPath, startOffsetStr, endXPath, endOffsetStr] = match;

  const startElement = document.evaluate(startXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  const endElement = document.evaluate(endXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (!startElement || !endElement) {
    throw new SystemError("Couldn't locate startElement, endElement in the document");
  }

  return {
    startElement: startElement as Element,
    startOffset: parseInt(startOffsetStr, 10),
    endElement: endElement as Element,
    endOffset: parseInt(endOffsetStr, 10),
  };
}