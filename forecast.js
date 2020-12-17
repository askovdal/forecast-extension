const waitForElements = async (
  selectors,
  delay = 1000,
  retries = 0,
  maxRetries = 5
) => {
  console.debug(`Looking for elements with selectors "${selectors}"...`);

  // Search for the elements
  const elements = document.querySelectorAll(selectors);

  if (!elements.length) {
    if (retries === maxRetries) {
      const message = `Elements with selectors "${selectors}" not found after ${maxRetries} retries`;
      console.debug(message);
      throw message;
    }

    // If the elements weren't found, wait for ~"delay" milliseconds
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });

    // Look for the elements again, creating a loop
    return waitForElements(selectors, delay, ++retries);
  }

  // If the elements were found, return them, stopping the loop
  console.debug(`Found elements with selectors "${selectors}"`);
  return elements;
};

const setCommentDates = (timeAgoEls) => {
  // TODO: Allow for different date formats
  for (const timeAgoEl of timeAgoEls) {
    const date = timeAgoEl.getAttribute('title');
    console.debug(`Replacing timestamp on comment with "${date}"...`);
    timeAgoEl.textContent = date;
  }
};

const showCommentDates = async (taskId) => {
  let timeAgoEls;
  try {
    timeAgoEls = await waitForElements('.time-ago');
  } catch (e) {
    console.debug(`No comments found for task ${taskId}`);
    return;
  }

  setCommentDates(timeAgoEls);

  // Observe dynamically added comments and set the comment date of those as
  // well
  const commentsEl = document.querySelector('.comment-section-container');
  new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
      for (const addedNode of addedNodes) {
        if (addedNode.hasChildNodes()) {
          const timeAgoEls = addedNode.querySelectorAll('.time-ago');
          setCommentDates(timeAgoEls);
        }
      }
    }
  }).observe(commentsEl, {
    childList: true,
    subtree: true,
  });
};

const extendTaskPage = (taskId) => {
  void showCommentDates(taskId);
};

chrome.runtime.onMessage.addListener(({ event, url }) => {
  console.debug(`Received event "${event}"`);
  if (event === 'forecastUrlUpdated') {
    // Check if the new URL is a task page
    const taskIdMatch = url.match(/\/T(\d+)(?:$|#)/);
    if (taskIdMatch) {
      extendTaskPage(taskIdMatch[1]);
    }
  }
});
