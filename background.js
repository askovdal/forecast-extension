chrome.tabs.onUpdated.addListener((tabId, { status }, { url }) => {
  if (url.includes('https://app.forecast.it') && status === 'complete') {
    chrome.tabs.sendMessage(tabId, {
      event: 'forecastUrlUpdated',
      url,
    });
  }
});
