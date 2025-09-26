import browser from "webextension-polyfill";
import { type AnnotationsResType, type HighlightReqType } from "../api/config";
import { UserError, SystemError } from "../utils/errors";

interface MessageMap {
  GET_HIGHLIGHT_DATA: { request: undefined; response: HighlightReqType };
  HIGHLIGHT_TEXT: { request: { highlightId: number, annotationXPathLink: string }; response: undefined };
  FETCH_ANNOTATIONS: { request: { currentURL: string }; response: AnnotationsResType }
  SHOW_SNACKBAR: { request: { message: string; duration?: number }; response: undefined }
}

interface ChromeMessageRequest<T extends keyof MessageMap> {
  type: T;
  data?: MessageMap[T]['request'];
}

type ChromeSuccessResponse<T> = {
  success: true;
  data: T;
};

type ChromeErrorResponse<E = string> = {
  success: false;
  error: E;
  isUserFacing: boolean;
};

type ChromeResponseType<T extends keyof MessageMap, E = string> = ChromeSuccessResponse<MessageMap[T]['response']> | ChromeErrorResponse<E>;


type MessageRequest<T extends keyof MessageMap> = MessageMap[T]['request'];
type MessageResponse<T extends keyof MessageMap> = MessageMap[T]['response'];


export function createMessageHandler<T extends keyof MessageMap>(
  type: T,
  handler: (request: MessageRequest<T>) => MessageResponse<T> | Promise<MessageResponse<T>>
) {
  browser.runtime.onMessage.addListener((message: ChromeMessageRequest<T>, _, sendResponse: (response: ChromeResponseType<T>) => void) => {
    console.log("Message received in createMessageHandler:", message);
    if (message.type === type) {
      try {
        const result = handler(message.data)
        if (result instanceof Promise) {
          result
            .then((data) => sendResponse({ success: true, data }))
            .catch((error) => {
              console.error("Error in message handler:", error);
              sendResponse({ success: false, error: error.message, isUserFacing: error.isUserFacing || false });
            });
          return true; // Keep channel open for async response
        } else {
          sendResponse({ success: true, data: result })
        }
      } catch (error) {
        console.error("Error in message handler:", error);
        sendResponse({ success: false, error: (error as Error).message, isUserFacing: (error as any).isUserFacing || false });
      }
    }
    return
  });
}

export async function sendMessageFromContentScript<T extends keyof MessageMap>(action: ChromeMessageRequest<T>): Promise<MessageResponse<T>> {
  try {
    const res = await browser.runtime.sendMessage(action) as ChromeResponseType<T>
    if (!res?.success) {
      if (res.isUserFacing) {
        throw new UserError(res.error);
      } else {
        throw new SystemError(res.error);
      }
    }
    return res.data;
  } catch (error) {
    console.error("Error sending message from content script:", error);
    throw new SystemError((error as Error).message);
  }
}

export async function sendMessageFromServiceWorker<T extends keyof MessageMap>(tabId: number, action: ChromeMessageRequest<T>): Promise<MessageResponse<T>> {
  try {
    const res = await browser.tabs.sendMessage(tabId, action) as ChromeResponseType<T>
    if (!res.success) {
      if (res.isUserFacing) {
        throw new UserError(res.error);
      } else {
        throw new SystemError(res.error);
      }
    }
    return res.data;
  } catch (error) {
    console.error("Error sending message from service worker:", error);
    throw new SystemError((error as Error).message);
  }
}