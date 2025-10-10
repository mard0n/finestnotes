import browser from "webextension-polyfill";
import { client } from "../api/config";
import { createMessageHandler, sendMessageFromServiceWorker } from "../messaging/index";
import { SystemError, UserError } from "../utils/errors";
import { getTabInfo } from "../utils/libs/getTabInfo";

console.log("Hello from the background!");


browser.commands.onCommand.addListener(async (command, tab) => {
  if (command === "highlight") {

    if (!tab?.id) { return }

    try {
      const response = await sendMessageFromServiceWorker(tab.id, { type: "GET_HIGHLIGHT_DATA" })

      const res = await client.api.highlight.$post({ json: response });
      console.log("res", res);
      if (!res.ok) {
        throw new SystemError("Failed to save highlight: " + res.statusText);
      }
      const data = await res.json();

      await sendMessageFromServiceWorker(tab.id, { type: "HIGHLIGHT_TEXT", data: { highlightId: data.id, annotationXPathLink: response.position } });

    } catch (error) {
      console.error("Error while highlighting:", error);
      if (error instanceof UserError) {
        const message = (error.message ? error.message : String(error)) || "Unknown error";
        await sendMessageFromServiceWorker(tab.id, {
          type: "SHOW_SNACKBAR",
          data: { message, duration: 5000 }
        });
      } else {
        console.log("Error while highlighting:", error);
      }
    }
  } else if (command === "save-page") {

    if (!tab?.id) { return }

    try {
      const response = await getTabInfo()

      // Check if page is already saved using the API directly
      const checkRes = await client.api.page.$get({
        query: {
          url: response.url
        }
      });

      if (!checkRes.ok) {
        throw new SystemError("Failed to check if page is saved: " + checkRes.statusText);
      }

      const checkData = await checkRes.json();
      const isPageSaved = checkData.length > 0;

      if (isPageSaved) {
        // Page is already saved, so delete it
        const pageId = checkData[0].id;
        const deleteRes = await client.api.page[":id"].$delete({ param: { id: pageId.toString() } });

        if (!deleteRes.ok) {
          throw new UserError("Failed to delete saved page: " + deleteRes.statusText);
        }

        await sendMessageFromServiceWorker(tab.id, {
          type: "SHOW_SNACKBAR",
          data: { message: "Page removed from saved pages!", duration: 3000, type: "success" }
        });
      } else {
        // Page is not saved, so save it
        const saveRes = await client.api.page.$post({
          json: {
            title: response.title,
            url: response.url,
            description: response.description,
            comment: ""
          }
        });

        if (!saveRes.ok) {
          throw new UserError("Failed to save page: " + saveRes.statusText);
        }

        await sendMessageFromServiceWorker(tab.id, {
          type: "SHOW_SNACKBAR",
          data: { message: "Page saved successfully!", duration: 3000, type: "success" }
        });
      }

    } catch (error) {
      console.error("Error while toggling page save:", error);
      if (error instanceof UserError) {
        const message = (error.message ? error.message : String(error)) || "Unknown error";
        await sendMessageFromServiceWorker(tab.id, {
          type: "SHOW_SNACKBAR",
          data: { message, duration: 5000 }
        });
      } else {
        console.log("Error while toggling page save:", error);
      }
    }
  }
});

createMessageHandler("FETCH_HIGHLIGHTS", async (request) => {
  const res = await client.api.highlight.$get({
    query: {
      page_url: request.url
    }
  })

  if (!res.ok) {
    throw new SystemError("Failed to fetch highlights: " + res.statusText)
  }
  const data = await res.json()
  return data
})

createMessageHandler("DELETE_HIGHLIGHT", async (request) => {
  const res = await client.api.highlight[":id"].$delete({ param: { id: request.highlightId.toString() } })
  if (!res.ok) {
    throw new UserError("Failed to delete highlight: " + res.statusText)
  }
  return undefined
})

createMessageHandler("CHECK_PAGE_SAVED", async (request) => {
  const res = await client.api.page.$get({
    query: {
      url: request.url
    }
  })

  if (!res.ok) {
    throw new SystemError("Failed to check if page is saved: " + res.statusText)
  }

  const data = await res.json()
  if (data.length > 0) {
    return data[0].id
  }
  return undefined
})

createMessageHandler("SAVE_PAGE", async (request) => {
  const res = await client.api.page.$post({
    json: {
      title: request.title,
      url: request.url,
      comment: request.comment,
      description: request.description
    }
  })

  if (!res.ok) {
    throw new UserError("Failed to save page: " + res.statusText)
  }

  return true
})

createMessageHandler("DELETE_SAVED_PAGE", async (request) => {
  const res = await client.api.page[":id"].$delete({ param: { id: request.pageId.toString() } })

  if (!res.ok) {
    throw new UserError("Failed to delete saved page: " + res.statusText)
  }

  return true
})