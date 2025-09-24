console.log("Hello from the content script!");

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message === 'highlight') {
    console.log("Highlight message received in content script");
    // Example functionality: Highlight all paragraphs on the page
    document.querySelectorAll('p').forEach(p => {
      p.style.backgroundColor = 'yellow';
    });
    sendResponse();
    return true; // Indicates that we will send a response asynchronously
  }
});