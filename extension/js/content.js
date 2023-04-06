chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'click_microphone_button') {
    clickMicrophoneButton();
    sendResponse({});
  } else if (request.message === 'check_button') {
    checkMicrophoneButtonStatus();
    sendResponse({});
  }
});

let observeButtonRetryCount = 0;

async function observeButton() {
  const button = await getMicrophoneButton();

  if (button) {
    checkMicrophoneButtonStatus();

    const config = { attributes: true, childList: false, subtree: false };
    const callback = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkMicrophoneButtonStatus();
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(button, config);
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

function clickMicrophoneButton() {
  getMicrophoneButton().then((button) => {
    if (button) {
      button.click();
    }
  });
}

function checkMicrophoneButtonStatus() {
  getMicrophoneButtonStatus().then((isOn) => {
    if (isOn === undefined) {
      sendMessageToBackground({ message: 'update_icon', isOn: false, disabled: true });
    } else {
      sendMessageToBackground({ message: 'update_icon', isOn: isOn, disabled: false });
    }
  });
}

async function getMicrophoneButtonStatus() {

  const button = await getMicrophoneButton();

  return new Promise((resolve) => {
    if (button) {
      const isOn = button.getAttribute('data-status') === 'true';
      resolve(isOn);
    } else {
      resolve(undefined);
    }
  });
}

async function getMicrophoneButton() {
  return new Promise((resolve) => {
    if (chrome.runtime.lastError) {
      resolve(undefined);
    }
    chrome.storage.sync.get("microphoneXPath", (data) => {
      const xpath = data.microphoneXPath;
      if (xpath) {
        const button = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        resolve(button);
      } else {
        resolve(undefined);
      }
    });
  });
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
    checkMicrophoneButtonStatus();
    window.addEventListener('focus', () => {
      checkMicrophoneButtonStatus();
    });
  }
});