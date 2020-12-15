// TODO: Look for URL changes and run relevant functions again

const waitForElements = async (selector, delay = 1000) => {
  // Search for the elements
  const elements = document.querySelectorAll(selector);

  console.log('Looking..');

  if (!elements.length) {
    // If the elements weren't found, wait for ~"delay" milliseconds
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });

    // Look for the elements again, creating a loop
    return waitForElements(selector, delay);
  }

  // If the elements were found, return them, stopping the loop
  return elements;
};

const setCommentDates = (timeAgoEls) => {
  // TODO: Allow for different date formats
  timeAgoEls.forEach((timeAgoEl) => {
    timeAgoEl.textContent = timeAgoEl.getAttribute('title');
  });
};

const showCommentDates = async () => {
  const timeAgoEls = await waitForElements('.time-ago');
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

// TODO: Only run this on task pages (reuse regex from forecast-unfurl).
void showCommentDates();
