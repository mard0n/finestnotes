import { client } from '../utils/types';

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command, tab) => {
    console.log(`Command: ${command}`);
    // const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && command === 'highlight') {
      // Highlight selected text
      console.log('browser.scripting.executeScript');
      browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection();
          if (selection) {
            return {
              content: selection.toString(),
              title: document.title
            };
          }
        }
      }).then(async (results) => {
        const [result] = results;
        if (result?.result) {
          const { content, title } = result.result;
          console.log("Selected text:", content, "Page title:", title);

          try {
            const res = await client.api.note.$post({json: { title, content }});
            console.log("Note saved:", res);
          } catch (err) {
            console.error("Error saving note:", err);
          }

          // await browser.storage.local.set({ content, title });
        }
      });
      // Send the selected text and title of the current tab to backend API
      // Save the selected text and title to storage
    } else {
      console.warn("No active tab found.");
    }
  })

});
