const waitForElements = async (
  selectors,
  delay = 1000,
  retries = 0,
  maxRetries = 5
) => {
  console.debug(`👁️ Looking for elements with selectors "${selectors}"...`);

  // Search for the elements
  const elements = document.querySelectorAll(selectors);

  if (!elements.length) {
    if (retries === maxRetries) {
      const message = `❌ Elements with selectors "${selectors}" not found after ${maxRetries} retries`;
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
  console.debug(`✅ Found elements with selectors "${selectors}"`);
  return elements;
};

const setCommentDates = (timeAgoEls) => {
  // TODO: Add option for different date formats
  for (const timeAgoEl of timeAgoEls) {
    const date = timeAgoEl.getAttribute('title');
    console.debug(`📅 Replacing timestamp on comment with "${date}"...`);
    timeAgoEl.textContent = date;
  }
};

const showCommentDates = async (taskId) => {
  try {
    const timeAgoEls = await waitForElements('.time-ago');
    setCommentDates(timeAgoEls);
  } catch (e) {
    console.debug(`❌ No comments found for task ${taskId}`);
  }

  // Observe dynamically added comments and set the comment date of those as
  // well
  const commentsEl = document.querySelector('.comment-section-container');
  if (!commentsEl) return;
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

let realDocumentTitle = '';
const setTaskPageDocumentTitle = async (taskId) => {
  // If the document title already has a task, do an early return
  if (document.title.match(/T\d+/)) return;
  // Save the real document title in a global variable
  realDocumentTitle = document.title;

  let taskNameEl;
  try {
    [taskNameEl] = await waitForElements('#task-modal-task-name');
  } catch (e) {
    console.debug(`❌ No task name found for task ${taskId}`);
    return;
  }

  const title = `T${taskId} ${taskNameEl.value}`;

  console.debug(`📝 Setting document title to "${title}"...`);

  document.title = title;
};

const setRealDocumentTitle = () => {
  // If the document title doesn't have a task, do an early return
  if (!document.title.match(/T\d+/)) return;

  console.debug(`📝 Setting document title back to "${realDocumentTitle}"...`);

  // Restore the real document title from the global variable
  document.title = realDocumentTitle;
};

chrome.runtime.onMessage.addListener(({ event, url }) => {
  console.debug(`📢 Received event "${event}"`);

  // Check if the new URL is a task page
  const taskIdMatch = url.match(/\/T(\d+)(?:$|#)/);
  const taskId = taskIdMatch && taskIdMatch[1];

  if (event === 'urlUpdated') {
    if (taskId) {
      void showCommentDates(taskId);
      void setTaskPageDocumentTitle(taskId);
    } else {
      setRealDocumentTitle();
    }
  } else if (event === 'documentTitleUpdated') {
    if (taskId) {
      void setTaskPageDocumentTitle(taskId);
    }
  }
});
