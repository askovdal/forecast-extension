chrome.tabs.onUpdated.addListener((tabId, { status, title }, { url }) => {
  if (url.includes('https://app.forecast.it')) {
    let event;
    if (status === 'complete') {
      event = 'urlUpdated';
    } else if (title) {
      event = 'documentTitleUpdated';
    }

    if (event) {
      chrome.tabs.sendMessage(tabId, { event, url });
    }
  }
});
