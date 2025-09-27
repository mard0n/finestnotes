import browser from "webextension-polyfill";
import { sendMessageFromContentScript } from "../messaging/index";

console.log("Hello from the popup!", { id: browser.runtime.id });

// Function to get current tab info and update the popup
async function updateTabInfo() {
  try {
    // Get the current active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab) {
      // Update the title
      const titleElement = document.querySelector('.source-title') as HTMLElement;
      if (titleElement && currentTab.title) {
        titleElement.textContent = currentTab.title;
      }
      
      // Update the URL
      const linkElement = document.querySelector('.source-link') as HTMLElement;
      if (linkElement && currentTab.url) {
        linkElement.textContent = currentTab.url;
        linkElement.setAttribute('title', currentTab.url);
      }
    }
  } catch (error) {
    console.error('Failed to get tab info:', error);
  }
}

// Function to check if the current page is already saved
async function checkIfPageSaved() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (!currentTab?.url) {
      return;
    }

    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    if (!saveBtn) {
      return;
    }

    const isPageSaved = await sendMessageFromContentScript({
      type: "CHECK_PAGE_SAVED",
      data: { url: currentTab.url }
    });

    if (isPageSaved) {
      // Page is already saved
      saveBtn.setAttribute('data-state', 'success');
      saveBtn.disabled = true;
    }
  } catch (error) {
    console.error('Failed to check if page is saved:', error);
  }
}

// Update tab info when the popup loads
document.addEventListener('DOMContentLoaded', async () => {
  await updateTabInfo();
  await checkIfPageSaved();

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSavePage);
  }
});

async function handleSavePage() {
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
  const titleElement = document.querySelector('.source-title') as HTMLElement;
  const linkElement = document.querySelector('.source-link') as HTMLElement;

  const sourceTitle = titleElement.textContent || '';
  const sourceLink = linkElement.getAttribute('title') || '';

  if (!sourceTitle || !sourceLink) {
    console.error('Could not get page title or URL');
    return;
  }

  saveBtn.setAttribute('data-state', 'pending');
  saveBtn.disabled = true;

  try {
    await sendMessageFromContentScript({
      type: "SAVE_PAGE",
      data: {
        sourceTitle,
        sourceLink,
      }
    });

    saveBtn.setAttribute('data-state', 'success');
  } catch (error) {
    console.error('Error saving page:', error);
    saveBtn.setAttribute('data-state', 'default');
    saveBtn.disabled = false;
  }
}
