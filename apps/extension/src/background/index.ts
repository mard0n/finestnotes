import browser from "webextension-polyfill";
import { client } from "../api/config";
import { SystemError, UserError } from "../utils/errors";
import { getTabInfo } from "../utils/libs/getTabInfo";
import { onMessage, sendMessage } from "../messaging";

console.log("Hello from the background!");


browser.commands.onCommand.addListener(async (command, tab) => {
  if (command === "highlight") {

    if (!tab?.id) { return }

    try {
      const selectionData = await sendMessage("getSelectionData", undefined, tab.id);

      const res = await client.api.highlight.$post({ json: selectionData });
      console.log("res", res);
      if (!res.ok) {
        throw new SystemError("Failed to save highlight: " + res.statusText);
      }
      const data = await res.json();

      await sendMessage("highlightText", { highlightId: data.id, annotationXPathLink: selectionData.position }, tab.id);

    } catch (error) {
      console.error("Error while highlighting:", error);
      if (error instanceof UserError) {
        const message = (error.message ? error.message : String(error)) || "Unknown error";
        sendMessage("showSnackbar", { message, duration: 5000, type: "error" }, tab.id);
      } else {
        console.log("Error while highlighting:", error);
      }
    }
  } else if (command === "save-page") {

    if (!tab?.id) { return }

    try {
      const tabInfo = await getTabInfo()

      // Check if page is already saved using the API directly
      const checkRes = await client.api.page.$get({
        query: {
          url: tabInfo.url
        }
      });

      if (!checkRes.ok) {
        throw new SystemError("Failed to check if page is saved: " + checkRes.statusText);
      }

      const checkData = await checkRes.json();
      const isPageSaved = checkData;

      if (isPageSaved) {
        // Page is already saved, so delete it
        const deleteRes = await client.api.page[":id"].$delete({ param: { id: checkData.id.toString() } });

        if (!deleteRes.ok) {
          throw new UserError("Failed to delete saved page: " + deleteRes.statusText);
        }

        sendMessage("showSnackbar", { message: "Page removed from saved pages!", duration: 3000, type: "success" }, tab.id);

      } else {
        // Page is not saved, so save it
        const saveRes = await client.api.page.$post({
          json: {
            title: tabInfo.title,
            url: tabInfo.url,
            description: tabInfo.description,
            comment: ""
          }
        });

        if (!saveRes.ok) {
          throw new UserError("Failed to save page: " + saveRes.statusText);
        }

        sendMessage("showSnackbar", { message: "Page saved successfully!", duration: 3000, type: "success" }, tab.id);

      }

    } catch (error) {
      console.error("Error while toggling page save:", error);
      if (error instanceof UserError) {
        const message = (error.message ? error.message : String(error)) || "Unknown error";
        sendMessage("showSnackbar", { message, duration: 5000, type: "error" }, tab.id);
      } else {
        console.log("Error while toggling page save:", error);
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

  if (!res.ok) {
    throw new SystemError("Failed to fetch highlights: " + res.statusText)
  }

  const data = await res.json()
  return data
});

onMessage("deleteHighlight", async (request) => {
  const res = await client.api.highlight[":id"].$delete({ param: { id: request.data.highlightId.toString() } })
  if (!res.ok) {
    throw new UserError("Failed to delete highlight: " + res.statusText)
  }
  return undefined
});

onMessage("getPage", async (request) => {
  const res = await client.api.page.$get({
    query: {
      url: request.data.url
    }
  })

  if (!res.ok) {
    throw new SystemError("Failed to check if page is saved: " + res.statusText)
  }

  const data = await res.json()
  if (data) {
    return data.id
  }
  return undefined
})

onMessage("savePage", async (request) => {
  const res = await client.api.page.$post({
    json: {
      title: request.data.title,
      url: request.data.url,
      comment: request.data.comment,
      description: request.data.description
    }
  })

  if (!res.ok) {
    throw new UserError("Failed to save page: " + res.statusText)
  }

  return true
})

onMessage("deletePage", async (request) => {
  const res = await client.api.page[":id"].$delete({ param: { id: request.data.pageId.toString() } })

  if (!res.ok) {
    throw new UserError("Failed to delete saved page: " + res.statusText)
  } return true
})