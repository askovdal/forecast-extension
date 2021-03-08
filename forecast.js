let showDebug = false;
chrome.storage.sync.get({ debug: false }, ({ debug }) => (showDebug = debug));

const debug = (message) => {
  showDebug && console.debug(message);
};

const waitForElements = async (
  selectors,
  delay = 1000,
  maxRetries = 5,
  retries = 0
) => {
  debug(`👁️ Looking for elements with selectors "${selectors}"...`);

  // Search for the elements
  const elements = document.querySelectorAll(selectors);

  if (!elements.length) {
    if (retries === maxRetries) {
      const message = `❌ Elements with selectors "${selectors}" not found after ${maxRetries} retries`;
      debug(message);
      throw message;
    }

    // If the elements weren't found, wait for ~"delay" milliseconds
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });

    // Look for the elements again, creating a loop
    return waitForElements(selectors, delay, maxRetries, ++retries);
  }

  // If the elements were found, return them, stopping the loop
  debug(`✅ Found elements with selectors "${selectors}"`);
  return elements;
};

const setCommentDates = (timeAgoEls) => {
  // TODO: Add option for different date formats
  // Get timezone offset in hours
  const offsetHours = new Date().getTimezoneOffset() / 60;

  // Regular expression that matches the hour in the date
  const hourRegex = /(\d+):/;

  for (const timeAgoEl of timeAgoEls) {
    const date = timeAgoEl.getAttribute('title');

    // Extract hour from date
    const hour = parseInt(hourRegex.exec(date)[1]);

    // Subtract offset from hour to get the local time (this won't work in the
    // edge cases where 1 > (hour - offsetHours) > 24, but it's fine for this
    // use case)
    const localHour = hour - offsetHours;

    // Assemble local date by replacing the original hour with the local hour
    const localDate = date.replace(hourRegex, `${localHour}:`);

    debug(`📅 Replacing timestamp on comment with "${localDate}"...`);
    timeAgoEl.textContent = localDate;
  }
};

const showCommentDates = async (taskId) => {
  try {
    const timeAgoEls = await waitForElements('.time-ago');
    setCommentDates(timeAgoEls);
  } catch (e) {
    debug(`❌ No comments found for task ${taskId}`);
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
  }).observe(commentsEl, { childList: true, subtree: true });
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
    debug(`❌ No task name found for task ${taskId}`);
    return;
  }

  const title = `T${taskId} ${taskNameEl.value}`;

  debug(`📝 Setting document title to "${title}"...`);

  document.title = title;
};

const setRealDocumentTitle = () => {
  // If the document title doesn't have a task, do an early return
  if (!document.title.match(/T\d+/)) return;

  debug(`📝 Setting document title back to "${realDocumentTitle}"...`);

  // Restore the real document title from the global variable
  document.title = realDocumentTitle;
};

chrome.runtime.onMessage.addListener(({ event, url }) => {
  debug(`📢 Received event "${event}"`);

  // Check if the new URL is a task page
  const taskIdMatch = url.match(/\/T(\d+)(?:$|#)/);
  const taskId = taskIdMatch && taskIdMatch[1];

  if (event === 'urlUpdated') {
    if (taskId) {
      showCommentDates(taskId);
      setTaskPageDocumentTitle(taskId);
    } else {
      setRealDocumentTitle();
    }
  } else if (event === 'documentTitleUpdated') {
    if (taskId) {
      setTaskPageDocumentTitle(taskId);
    }
  }
});
