chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'click_button') {
    clickButton();
    sendResponse({});
  }
});

function clickButton() {
  const xpath = '//*[@id="MenuBar"]/div[2]/button[1]';
  const button = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (button) {
    button.click();
  }
}

function observeButton() {
  const xpath = '//*[@id="MenuBar"]/div[2]/button[1]';
  const targetNode = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

  if (targetNode) {
    const config = { attributes: true, childList: false, subtree: false };
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isOn = targetNode.getAttribute('data-status') === 'true';
          chrome.runtime.sendMessage({ message: 'update_icon', isOn: isOn, disabled: false });
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  } else {
    chrome.runtime.sendMessage({ message: 'update_icon', isOn: false, disabled: true });
  }
}

function observePage() {
  const targetNode = document.documentElement;

  if (targetNode) {
    const config = { childList: true, subtree: true };
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          observeButton();
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }
}

function sendMessageToBackground(message) {
  if (chrome.runtime) {
    chrome.runtime.sendMessage(message);
  }
}

observePage();
observeButton();
