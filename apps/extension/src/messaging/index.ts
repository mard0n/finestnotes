import { defineExtensionMessaging } from '@webext-core/messaging';
import { client } from "../api/config";
import type { InferRequestType, InferResponseType } from 'hono';

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

  fetchHighlights(params: { url: string }): InferResponseType<typeof client.api.highlight.$get>;
  deleteHighlight(params: { highlightId: number }): void;

  savePage(params: InferRequestType<typeof client.api.page.$post>['json']): boolean;
  getPage(params: { url: string }): number | undefined;
  deletePage(params: { pageId: number }): boolean;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();