
import { createSignal, onMount } from 'solid-js';
import browser from "webextension-polyfill";
import { sendMessageFromContentScript } from "../messaging/index";
import { getTabInfo } from "../utils/libs/getTabInfo";

type SaveButtonState = 'default' | 'pending' | 'success' | 'deleting';

function App() {
  const [title, setTitle] = createSignal('Loading page title...');
  const [url, setUrl] = createSignal('Loading page URL...');
  const [note, setNote] = createSignal('');
  const [saveButtonState, setSaveButtonState] = createSignal<SaveButtonState>('default');
  const [currentPageId, setCurrentPageId] = createSignal<number | null>(null);
  const [saveButtonDisabled, setSaveButtonDisabled] = createSignal(false);

  console.log("Hello from the popup!", { id: browser.runtime.id });

  async function updateTabInfo() {
    try {
      const tabInfo = await getTabInfo();
      
      if (tabInfo.title && tabInfo.url) {
        setTitle(tabInfo.title);
        setUrl(tabInfo.url);
      }
    } catch (error) {
      console.error('Failed to get tab info:', error);
    }
  }

  async function checkIfPageSaved() {
    try {
      const currentUrl = url();
      
      if (!currentUrl || currentUrl === 'Loading page URL...') {
        return;
      }

      const pageStatus = await sendMessageFromContentScript({
        type: "CHECK_PAGE_SAVED",
        data: { url: currentUrl }
      });

      if (pageStatus.saved && pageStatus.pageId) {
        setCurrentPageId(pageStatus.pageId);
        setSaveButtonState('success');
        setSaveButtonDisabled(false);
      }
    } catch (error) {
      console.error('Failed to check if page is saved:', error);
    }
  }

  async function handleSavePage() {
    const currentState = saveButtonState();
    const pageId = currentPageId();

    if (currentState === 'success' && pageId) {
      await handleUnsavePage();
      return;
    }

    const sourceTitle = title();
    const sourceLink = url();

    if (!sourceTitle || !sourceLink || sourceTitle === 'Loading page title...' || sourceLink === 'Loading page URL...') {
      console.error('Could not get page title or URL');
      return;
    }

    setSaveButtonState('pending');
    setSaveButtonDisabled(true);

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
      setSaveButtonState('default');
      setSaveButtonDisabled(false);
    }
  }

  async function handleUnsavePage() {
    const pageId = currentPageId();

    if (!pageId) {
      console.error('No page ID to delete');
      return;
    }

    setSaveButtonState('deleting');
    setSaveButtonDisabled(true);

    try {
      await sendMessageFromContentScript({
        type: "DELETE_SAVED_PAGE",
        data: {
          pageId: pageId
        }
      });

      // Reset the state
      setCurrentPageId(null);
      setSaveButtonState('default');
      setSaveButtonDisabled(false);
    } catch (error) {
      console.error('Error deleting saved page:', error);
      setSaveButtonState('success');
      setSaveButtonDisabled(false);
    }
  }

  async function handleVisitDashboard() {
    // Add dashboard visit logic here
    console.log('Visit dashboard clicked');
  }

  async function handleScreenshot() {
    // Add screenshot logic here
    console.log('Screenshot clicked');
  }

  onMount(async () => {
    await updateTabInfo();
    await checkIfPageSaved();
  });

  return (
    <div class="flex flex-col border border-gray-300 w-[280px] p-4 m-0 bg-white font-sans">
      <nav class="mb-4">
        <div class="flex justify-between items-center">
          <span class="font-serif text-sm italic">
            Finest
          </span>
          <button 
            class="mr-2 align-sub cursor-pointer bg-none border-none w-4 h-4 p-0 hover:opacity-90"
            title="Visit dashboard" 
            onClick={handleVisitDashboard}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd"
                d="M8.25 3.75H19.5a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-1.5 0V6.31L5.03 20.03a.75.75 0 0 1-1.06-1.06L17.69 5.25H8.25a.75.75 0 0 1 0-1.5Z"
                clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </nav>

      <main>
        <div class="mb-4">
          <h1 class="font-bold text-base m-0 mb-1 p-0">{title()}</h1>
          <p class="italic text-xs m-0 truncate" title={url()}>{url()}</p>
        </div>

        <div class="mb-4">
          <label for="note" class="block mb-1 text-xs tracking-wider">Note</label>
          <textarea 
            id="note" 
            name="note" 
            rows="4" 
            cols="30" 
            placeholder="Add a note..."
            class="w-full h-[100px] resize-none text-xs p-2 border border-gray-300 rounded"
            value={note()}
            onInput={(e) => setNote(e.currentTarget.value)}
          />
        </div>

        <div class="flex justify-between gap-2 h-8">
          <button 
            class={`flex-1 p-2 text-sm font-medium border-none rounded cursor-pointer bg-black text-white hover:opacity-90 flex items-center justify-center gap-1 ${saveButtonDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Save page: ^ ⇧ D" 
            disabled={saveButtonDisabled()}
            onClick={handleSavePage}
          >
            <span class={`flex items-center justify-center gap-1 ${saveButtonState() === 'default' ? 'flex' : 'hidden'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                class="h-3.5 pb-px">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
              <span>Save</span>
            </span>
            <span class={`flex items-center justify-center gap-1 ${saveButtonState() === 'pending' ? 'flex' : 'hidden'}`}>
              <svg class="spinner w-3.5 h-3.5" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
              </svg>
              <span>Saving...</span>
            </span>
            <span class={`flex items-center justify-center gap-1 ${saveButtonState() === 'success' ? 'flex' : 'hidden'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 pb-px">
                <path fill-rule="evenodd"
                  d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21L12 17.25 2.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                  clip-rule="evenodd" />
              </svg>
              <span>Saved</span>
            </span>
            <span class={`flex items-center justify-center gap-1 ${saveButtonState() === 'deleting' ? 'flex' : 'hidden'}`}>
              <svg class="spinner w-3.5 h-3.5" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
              </svg>
              <span>Removing...</span>
            </span>
          </button>
          <button 
            class="max-w-8 p-2 text-sm font-medium border-none rounded cursor-pointer bg-black text-white hover:opacity-90 flex items-center justify-center"
            title="Screenshot: ^ ⇧ S" 
            onClick={handleScreenshot}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path
                d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2a.75.75 0 0 0 1.5 0v-2a.75.75 0 0 1 .75-.75h2a.75.75 0 0 0 0-1.5h-2ZM13.75 2a.75.75 0 0 0 0 1.5h2a.75.75 0 0 1 .75.75v2a.75.75 0 0 0 1.5 0v-2A2.25 2.25 0 0 0 15.75 2h-2ZM3.5 13.75a.75.75 0 0 0-1.5 0v2A2.25 2.25 0 0 0 4.25 18h2a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 1-.75-.75v-2ZM18 13.75a.75.75 0 0 0-1.5 0v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 0 0 1.5h2A2.25 2.25 0 0 0 18 15.75v-2ZM7 10a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
