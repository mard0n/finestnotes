import { generateXPathLink } from "./utils/libs/getXPath";
import { createMessageHandler } from "./messaging";

console.log("Hello from the content script!");

// createMessageHandler("GET_USER", async (request) => {
//   console.log("Highlight text message received in content script via handler");
//   // Implement your highlight text logic here
//   return { success: true, data: {name: "qwe", id: "123"} };
// });

createMessageHandler("GET_HIGHLIGHT_DATA", () => {
  console.log("Highlight message received in content script via handler");
  try {
    const url = window.location.href
    const cleanUrl = new URL(url).origin + new URL(url).pathname;
    const sourceTitle = document.title;
    const sourceLink = cleanUrl;
    const selection = window.getSelection();
    const content = selection ? selection.toString() : '';
    const link = selection ? generateXPathLink(selection, cleanUrl) : '';
    console.log("success", {sourceTitle, sourceLink, content, link});;
    return { success: true, data: {sourceTitle, sourceLink, content, link} };
  } catch (error) {
    console.error("Error generating highlight data:", error);
    return { success: false, error: (error as Error).message };
  }
});


// browser.runtime.onMessage.addListener((message, _, sendResponse) => {
//   console.log('message.type', message.type);
//   if (message.type === MESSAGE.GET_HIGHLIGHT_DATA) {
//     console.log("Highlight message received in content script");
//     try {
//       const url = window.location.href
//       const cleanUrl = new URL(url).origin + new URL(url).pathname;
//       const sourceTitle = document.title;
//       const sourceLink = cleanUrl;
//       const selection = window.getSelection();
//       const content = selection ? selection.toString() : '';
//       const link = selection ? generateXPathLink(selection, cleanUrl) : '';
//       console.log("success", {sourceTitle, sourceLink, content, link});
//       sendResponse({ success: true, data: {sourceTitle, sourceLink, content, link} });
//     } catch (error) {
//       console.error("Error generating highlight data:", error);
//       sendResponse({ success: false, error: (error as Error).message });
//     }
//     return true; // Indicates that we will send a response asynchronously
//   } else if (message.type === MESSAGE.HIGHLIGHT_TEXT) {
//     console.log("Highlight text message received in content script");
//     // Implement your highlight text logic here
//     sendResponse({ success: true, data: null });
//   }
//   return
// });

