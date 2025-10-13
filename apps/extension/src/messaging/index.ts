import { defineExtensionMessaging } from '@webext-core/messaging';
import { client } from "../api/config";
import type { InferRequestType } from 'hono';

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

  fetchHighlights(params: { url: string }): ReturnType<typeof client.api.highlight.$get>;
  deleteHighlight(params: { highlightId: number }): ReturnType<typeof $highlight_delete>;

  savePage(params: InferRequestType<typeof client.api.page.$post>['json']): ReturnType<typeof client.api.page.$post>;
  getPage(params: { url: string }): ReturnType<typeof client.api.page.$get>;
  deletePage(params: { pageId: number }): ReturnType<typeof $page_delete>;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
