import browser from "webextension-polyfill";
import { type HighlightReqType } from "../api/config";

type SuccessResponse<T> = {
  success: true;
  data: T;
};

type ErrorResponse<E = string> = {
  success: false;
  error: E;
};

type ResponseType<T, E = string> = SuccessResponse<T> | ErrorResponse<E>;

interface MessageMap {
  GET_HIGHLIGHT_DATA: { request: undefined; response: ResponseType<HighlightReqType> };
  HIGHLIGHT_TEXT: { request: undefined; response: ResponseType<undefined> };
}

type MessageType = keyof MessageMap;
type MessageRequest<T extends MessageType> = MessageMap[T]['request'];
type MessageResponse<T extends MessageType> = MessageMap[T]['response'];

interface ChromeMessage<T extends MessageType> {
  type: T;
  data: MessageRequest<T>;
}

export function createMessageHandler<T extends MessageType>(
  type: T,
  handler: (request: MessageRequest<T>) => MessageResponse<T> | Promise<MessageResponse<T>>
) {
  browser.runtime.onMessage.addListener((message: ChromeMessage<T>, _, sendResponse: (response: MessageResponse<T>) => void) => {
    if (message.type === type) {
      const result = handler(message.data);
      if (result instanceof Promise) {
        result.then(sendResponse);
        return true; // Keep channel open for async response
      } else {
        sendResponse(result);
      }
    }
    return
  });
}

type Action<T extends keyof MessageMap> = {
  type: T,
  data?: MessageRequest<T>
}

export async function sendMessage<T extends MessageType>(tabId: number, action: Action<T>): Promise<MessageResponse<T>> {
  console.log("tabId", tabId);
  console.log("action.type", action.type);
  return browser.tabs.sendMessage(tabId, action);
}