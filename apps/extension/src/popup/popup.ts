import browser from "webextension-polyfill";
import { sendMessageFromContentScript } from "../messaging/index";
import { getTabInfo } from "../utils/libs/getTabInfo";

console.log("Hello from the popup!", { id: browser.runtime.id });


async function updateTabInfo() {
  try {
    const { title, url } = await getTabInfo();
    
    if (title && url) {
      const titleElement = document.querySelector('.source-title') as HTMLElement;
      if (titleElement && title) {
        titleElement.textContent = title;
      }
      
      const linkElement = document.querySelector('.source-link') as HTMLElement;
      if (linkElement && url) {
        linkElement.textContent = url;
        linkElement.setAttribute('title', url);
      }
    }
  } catch (error) {
    console.error('Failed to get tab info:', error);
  }
}

// Global variable to store the page ID if it's saved
let currentPageId: number | null = null;

// Function to check if the current page is already saved
async function checkIfPageSaved() {
  try {
    const { url } = await getTabInfo();

    if (!url) {
      return;
    }

    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    if (!saveBtn) {
      return;
    }

    const pageStatus = await sendMessageFromContentScript({
      type: "CHECK_PAGE_SAVED",
      data: { url: url }
    });

    if (pageStatus.saved && pageStatus.pageId) {
      // Page is already saved
      currentPageId = pageStatus.pageId;
      saveBtn.setAttribute('data-state', 'success');
      saveBtn.disabled = false; // Allow clicking to unsave
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
  const currentState = saveBtn.getAttribute('data-state');

  if (currentState === 'success' && currentPageId) {
    await handleUnsavePage();
    return;
  }

  const { title: sourceTitle, url: sourceLink } = await getTabInfo();

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

    // After saving, check the page status again to get the page ID
    await checkIfPageSaved();
  } catch (error) {
    console.error('Error saving page:', error);
    saveBtn.setAttribute('data-state', 'default');
    saveBtn.disabled = false;
  }
}

async function handleUnsavePage() {
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

  if (!currentPageId) {
    console.error('No page ID to delete');
    return;
  }

  saveBtn.setAttribute('data-state', 'deleting');
  saveBtn.disabled = true;

  try {
    await sendMessageFromContentScript({
      type: "DELETE_SAVED_PAGE",
      data: {
        pageId: currentPageId
      }
    });

    // Reset the state
    currentPageId = null;
    saveBtn.setAttribute('data-state', 'default');
    saveBtn.disabled = false;
  } catch (error) {
    console.error('Error deleting saved page:', error);
    saveBtn.setAttribute('data-state', 'success');
    saveBtn.disabled = false;
  }
}
