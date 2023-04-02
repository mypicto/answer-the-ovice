let observeButtonRetryCount = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'click_button') {
    clickButton();
    sendResponse({});
  } else if (request.message === 'check_button') {
    checkButtonStatus();
    sendResponse({});
  }
});

function observeButton() {
  const targetNode = getTargetNode();

  if (targetNode) {
    checkButtonStatus();

    const config = { attributes: true, childList: false, subtree: false };
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkButtonStatus();
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
    observeButtonRetryCount = 0;
  } else {
    if (observeButtonRetryCount < 60) {
      observeButtonRetryCount++;
      setTimeout(() => {
        observeButton();
      }, 1000);
    } else {
      console.error("Failed to find targetNode after 60 retries");
    }
  }
}

function clickButton() {
  const button = getTargetNode();
  if (button) {
    button.click();
  }
}

function checkButtonStatus() {
  const targetNode = getTargetNode();
  if (targetNode) {
    const isOn = targetNode.getAttribute('data-status') === 'true';
    sendMessageToBackground({ message: 'update_icon', isOn: isOn, disabled: false });
  } else {
    sendMessageToBackground({ message: 'update_icon', isOn: false, disabled: true });
  }
}

function getTargetNode() {
  const xpath = '//*[@id="MenuBar"]/div[2]/button[1]';
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function sendMessageToBackground(message) {
  if (chrome.runtime) {
    chrome.runtime.sendMessage(message);
  } else {
    console.error('Extension context invalidated.');
  }
}

if (window.location.href.startsWith('https://***.ovice.in/')) {
  observeButton();
  checkButtonStatus();
  window.addEventListener('focus', () => {
    checkButtonStatus();
  });
}