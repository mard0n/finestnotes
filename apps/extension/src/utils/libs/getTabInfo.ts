import browser from "webextension-polyfill";
import { sendMessageFromServiceWorker } from "../../messaging";

export interface TabInfo {
  title: string;
  url: string;
}

export const getTabInfo = async (): Promise<TabInfo> => {
  // Content script - always accurate
  if (typeof document !== 'undefined' && document.title !== undefined && (window.location.href.startsWith('http') || window.location.href.startsWith('https'))) {
    const url = window.location.href;
    const cleanUrl = new URL(url).origin + new URL(url).pathname;
    return {
      title: document.title,
      url: cleanUrl
    };
  }

  // Background script - request from content script for accuracy
  if (typeof browser !== 'undefined' && browser.tabs) {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id) {
      throw new Error('No active tab found');
    }

    try {
      const result = await sendMessageFromServiceWorker(tab.id, { type: "GET_PAGE_DATA" });

      return result
    } catch (error) {
      console.error("Error executing script to get tab info:", error);
      throw new Error('Unable to get tab info from content script');
    }
  }

  throw new Error('Unable to get tab info');
};