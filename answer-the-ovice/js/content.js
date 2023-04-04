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
      console.info("Failed to find targetNode after 60 retries");
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
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.info(chrome.runtime.lastError.message);
      }
    });
  } else {
    console.info('Extension context invalidated.');
  }
}

async function getSpaceDomain() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("spaceDomain", (data) => {
      if (data.spaceDomain) {
        resolve(data.spaceDomain);
      } else {
        resolve(undefined);
      }
    });
  });
}

async function getOveceUrl() {
  const spaceDomain = await getSpaceDomain();
  return `https://${spaceDomain}.ovice.in/`;
}

getOveceUrl().then((oviceUrl) => {
  if (window.location.href.startsWith(oviceUrl)) {
    observeButton();
    checkButtonStatus();
    window.addEventListener('focus', () => {
      checkButtonStatus();
    });
  }
});