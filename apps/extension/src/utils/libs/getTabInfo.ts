import browser from "webextension-polyfill";

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
      const result = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const url = window.location.href;
          const cleanUrl = new URL(url).origin + new URL(url).pathname;
          return {
            title: document.title,
            url: cleanUrl
          };
        }
      });


      return result[0].result;
    } catch (error) {
      console.error("Error executing script to get tab info:", error);
      return {
        title: tab.title || '',
        url: tab.url || ''
      };
    }
  }

  throw new Error('Unable to get tab info');
};