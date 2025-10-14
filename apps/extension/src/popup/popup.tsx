
import { createEffect, createResource, createSignal, Show } from 'solid-js';
import { getTabInfo } from "../utils/libs/getTabInfo";
import { sendMessage } from '../messaging';
import { authClientSolid } from '../auth/auth-client';
import browser from 'webextension-polyfill';


async function checkIfPageSaved(url: string) {
  console.log('Checking if page is saved for url:', url);
  if (!url) {
    return Promise.resolve(undefined);
  }

  const page = await sendMessage("getPage", { url });

  if (page?.success) {
    return page.data
  }

  return
}


async function getSession() {
  try {
    const session = await authClientSolid.getSession();
    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}



function App() {
  const [tabInfo] = createResource(getTabInfo);
  const [pageId, { refetch }] = createResource(() => tabInfo()?.url, checkIfPageSaved);
  const [session] = createResource(getSession);

  const [note, setNote] = createSignal('');

  createEffect(() => {
    if (pageId()?.comment) {
      setNote(pageId()!.comment || '');
    } else {
      setNote('');
    }
  });

  async function handleSavePage() {
    if (tabInfo()?.title === undefined || tabInfo()?.url === undefined) {
      console.error('No tab info to save');
      return;
    }

    const userId = session()?.data?.user?.id;
    if (!userId) {
      console.error('No user ID found in session');
      return;
    }

    try {
      sendMessage("savePage", {
        title: tabInfo()!.title,
        url: tabInfo()!.url,
        description: tabInfo()!.description,
        comment: note(),
        userId: userId
      }).finally(refetch);

    } catch (error) {
      console.error('Error saving page:', error);
    }
  }

  async function handleUnsavePage() {
    if (!pageId()) {
      console.error('No page ID to delete');
      return;
    }

    try {
      await sendMessage("deletePage", { pageId: pageId()!.id }).finally(refetch);

    } catch (error) {
      console.error('Error deleting saved page:', error);
    }
  }

  async function handleVisitDashboard() {
    // Add dashboard visit logic here
    console.log('Visit dashboard clicked');
  }

  async function handleLogin() {
    try {
      const webUrl = import.meta.env.VITE_WEB_URL || "http://localhost:4321";
      browser.tabs.create({ url: `${webUrl}/login` });
    } catch (error) {
      console.error('Error during login:', error);
    }
  }

  async function handleLogout() {
    try {
      await authClientSolid.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
  return (
    <div class="flex flex-col border border-gray-300 w-[280px] p-4 m-0 bg-white font-sans">
      <nav class="mb-4 flex justify-between items-center">
        <div class="flex gap-1 items-center">
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
        <Show when={session()?.data?.user}>
          <div>
            <button class='cursor-pointer' onClick={handleLogout}>Logout</button>
          </div>
        </Show>
      </nav>
      <Show when={session()?.data?.user} fallback={
        <main>
          <p>Please log in.</p>
          <button
            class={`flex-1 p-2 text-sm font-medium border-none rounded cursor-pointer bg-black text-white hover:opacity-90 flex items-center justify-center gap-1`}
            onClick={handleLogin}
          >
            <span class={`flex items-center justify-center gap-1`}>
              <span>Login</span>
            </span>
          </button>
        </main>
      }>
        <main>
          <div class='mb-4'>
            <h1 class="font-bold text-base m-0 mb-1 p-0">{tabInfo()?.title}</h1>
            <p class="italic text-xs m-0 truncate" title={tabInfo()?.url}>{tabInfo()?.url}</p>
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

            <Show when={pageId()} fallback={
              <button
                class={`flex-1 p-2 text-sm font-medium border-none rounded cursor-pointer bg-black text-white hover:opacity-90 flex items-center justify-center gap-1`}
                title="Save page: ^ ⇧ D"
                onClick={handleSavePage}
              >
                <span class={`flex items-center justify-center gap-1`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                    class="h-3.5 pb-px">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  <span>Save</span>
                </span>
              </button>
            }>
              <button
                class={`flex-1 p-2 text-sm font-medium border-none rounded cursor-pointer bg-black text-white hover:opacity-90 flex items-center justify-center gap-1`}
                title="Unsave page: ^ ⇧ D"
                onClick={handleUnsavePage}
              >
                <span class={`flex items-center justify-center gap-1`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 pb-px">
                    <path fill-rule="evenodd"
                      d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21L12 17.25 2.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
                      clip-rule="evenodd" />
                  </svg>
                  <span>Saved</span>
                </span>
              </button>
            </Show>
          </div>
        </main>
      </Show>

    </div>
  );
}

export default App;
