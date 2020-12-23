const saveOptions = () => {
  const debug = document.getElementById('debug').checked;

  chrome.storage.sync.set({ debug }, async () => {
    const status = document.getElementById('status');

    status.textContent = '✅ Options saved';
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status.textContent = '';
  });
};

const showOptions = () => {
  chrome.storage.sync.get(
    { debug: false },
    ({ debug }) => (document.getElementById('debug').checked = debug)
  );
};

document.getElementById('save').addEventListener('click', saveOptions);
document.addEventListener('DOMContentLoaded', showOptions);
