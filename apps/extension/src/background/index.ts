import browser from "webextension-polyfill";
import { client } from "../api/config";
import { getTabInfo } from "../utils/libs/getTabInfo";
import { onMessage, sendMessage } from "../messaging";
import { DetailedError, parseResponse } from "hono/client";
import { authClient } from "../auth/auth-client";

browser.commands.onCommand.addListener(async (command, tab) => {
  const session = await authClient.getSession()
  if (!(session.data?.user)) {
    await sendMessage("showSnackbar", { message: "You need to be logged in to use this feature", duration: 5000 }, tab?.id);
    return
  }

  if (command === "highlight") {
    if (!tab?.id) { return }

    const selectionData = await sendMessage("getSelectionData", undefined, tab.id);

    const highlightRes = await client.api.highlight.$post({ json: selectionData });
    const highlightData = await parseResponse(highlightRes).catch(
      (e: DetailedError) => {
        console.error("DetailedError", e)
      }
    )

    if (!(highlightData?.id)) {
      return
    }

    await sendMessage("highlightText", { highlightId: highlightData.id, annotationXPathLink: selectionData.position }, tab.id);
  } else if (command === "save-page") {
    if (!tab?.id) { return }

    const tabInfo = await getTabInfo()

    // Check if page is already saved using the API directly
    const pageRes = await client.api.page.$get({
      query: {
        url: tabInfo.url
      }
    });

    const pageData = await parseResponse(pageRes).catch(
      (e: DetailedError) => {
        console.error("DetailedError", e)
      }
    )
    const isPageSaved = pageData?.success

    if (isPageSaved) {
      const deleteRes = await client.api.note[":id"].$delete({ param: { id: pageData.data.id.toString() } });
      const deleteData = await parseResponse(deleteRes).catch(
        (e: DetailedError) => {
          console.error("DetailedError", e)
        }
      )
      if (deleteData?.success) {
        sendMessage("showSnackbar", { message: "Page removed from saved pages!", duration: 3000, type: "success" }, tab.id);
      }
    } else {
      const saveRes = await client.api.page.$post({
        json: {
          title: tabInfo.title,
          url: tabInfo.url,
          description: tabInfo.description
        }
      });
      const saveData = await parseResponse(saveRes).catch(
        (e: DetailedError) => {
          console.error("DetailedError", e)
        }
      )
      if (saveData?.success) {
        sendMessage("showSnackbar", { message: "Page saved successfully!", duration: 3000, type: "success" }, tab.id);
      }
    }
  }
});

onMessage("fetchHighlights", async (request) => {
  const res = await client.api.highlight.$get({
    query: {
      page_url: request.data.url
    }
  })

  return await parseResponse(res).catch((e: DetailedError) => { console.error("DetailedError calling fetchHighlights", e) })
});

onMessage("deleteHighlight", async (request) => {
  const res = await client.api.highlight[":id"].$delete({ param: { id: request.data.highlightId.toString() } })
  return await parseResponse(res).catch((e: DetailedError) => { console.error("DetailedError calling deleteHighlight", e) })
});

onMessage("getPage", async (request) => {
  const res = await client.api.page.$get({
    query: {
      url: request.data.url
    }
  })
  return await parseResponse(res).catch((e: DetailedError) => { console.error("DetailedError calling getPage", e) })
})

onMessage("savePage", async (request) => {
  const res = await client.api.page.$post({
    json: request.data
  })
  return await parseResponse(res).catch((e: DetailedError) => { console.error("DetailedError calling savePage", e) })
})

onMessage("deletePage", async (request) => {
  const res = await client.api.note[":id"].$delete({ param: { id: request.data.pageId.toString() } })
  return await parseResponse(res).catch((e: DetailedError) => { console.error("DetailedError calling deletePage", e) })
})


browser.runtime.onMessageExternal.addListener((message: any, sender: any, sendResponse: any) => {
  if (message.type === "authToken" && message.token) {
    browser.storage.local.set({ authToken: message.token })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error saving auth token:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  return;
});
