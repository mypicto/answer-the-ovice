chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'click_microphone_button') {
    clickMicrophoneButton();
    sendResponse({});
  } else if (request.message === 'change_leaving') {
    changeLeaving();
    sendResponse({});
  } else if (request.message === 'check_button') {
    checkMicrophoneButtonStatus();
    sendResponse({});
  }
});

let observeButtonRetryCount = 0;

function observeButton() {
  const button = getMicrophoneButton();

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
  const button = getMicrophoneButton();
  if (button) {
    button.click();
  }
}

function clickLeavingButton() {
  const button = getLeavingButton();
  console.log("button: " + button());
  if (button) {
    button.click();
  }
}

function checkMicrophoneButtonStatus() {
  const isOn = getMicrophoneButtonStatus();
  if (isOn === undefined) {
    sendMessageToBackground({ message: 'update_icon', isOn: false, disabled: true });
  } else {
    sendMessageToBackground({ message: 'update_icon', isOn: isOn, disabled: false });
  }
}

function getMicrophoneButtonStatus() {
  const button = getMicrophoneButton();
  if (button) {
    return button.getAttribute('data-status') === 'true';
  } else {
    return undefined;
  }
}

function changeLeaving() {
  console.log("changeLeaving");
  console.log("getLeavingButtonStatus: " + getLeavingButtonStatus());
  if (getLeavingButtonStatus() === false) {
    clickLeavingButton();
  }
}

function getLeavingButtonStatus() {
  const button = getLeavingButton();
  if (button) {
    if (button.classList.contains('MuiIconButton-colorInfo')) {
      return true;
    } else if (button.classList.contains('MuiIconButton-colorSecondary')) {
      return false;
    }
  }
  return undefined;
}

function getMicrophoneButton() {
  const xpath = '//*[@id="MenuBar"]/div[3]/button[2]';
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getLeavingButton() {
  const xpath = '//*[@id="status-menu"]/li[2]';
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
    checkMicrophoneButtonStatus();
    window.addEventListener('focus', () => {
      checkMicrophoneButtonStatus();
    });
  }
});