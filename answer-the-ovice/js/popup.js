document.getElementById('clickButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clickButton' });
  });
  