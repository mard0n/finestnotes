import { defineExtensionMessaging } from '@webext-core/messaging';
import { client } from "../api/config";
import type { InferRequestType, InferResponseType } from 'hono';

const $page_delete = client.api.page[':id'].$delete
const $highlight_delete = client.api.highlight[':id'].$delete

interface ProtocolMap {
  getSelectionData(): {
    pageTitle: string;
    pageURL: string;
    pageDescription: string;
    text: string;
    position: string;
  };
  getTabInfo(): { title: string; url: string; description: string };

  highlightText(params: { highlightId: number, annotationXPathLink: string }): void;
  showSnackbar(params: { message: string; duration?: number; type?: 'error' | 'success' }): void;

  fetchHighlights(params: { url: string }): void | InferResponseType<typeof client.api.highlight.$get>;
  deleteHighlight(params: { highlightId: number }): void | InferResponseType<typeof $highlight_delete>;

  savePage(params: InferRequestType<typeof client.api.page.$post>['json']): void | InferResponseType<typeof client.api.page.$post>;
  getPage(params: { url: string }): void | InferResponseType<typeof client.api.page.$get>;
  deletePage(params: { pageId: number }): void | InferResponseType<typeof $page_delete>;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
