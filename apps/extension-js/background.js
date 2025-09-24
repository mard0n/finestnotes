chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "highlight") {
    console.log("Highlight command triggered");
    // You can add more functionality here, such as sending a message to the content script
    chrome.runtime.sendMessage('highlight').then(response => {
      console.log('Response from content script:', response);
    }).catch(error => {
      console.error('Error sending message to content script:', error);
    });
  }
});