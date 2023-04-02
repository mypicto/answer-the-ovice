let globalIconState = {
  isOn: false,
  isDisabled: false,
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    requestCheckButton().then();
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!isOviceUrl(tab.url)) {
      updateExtensionIconImpl(activeInfo.tabId, globalIconState);
    }
  });
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  requestCheckButton();
});

chrome.action.onClicked.addListener(async () => {
  sendClickButtonMessage();
});
  
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'update_icon') {
    updateExtensionIcon(request.isOn, request.disabled);
  } else if (request.message === 'reload_ovice_tabs') {
    reloadOviceTabs();
  }
});

function isOviceUrl(url) {
  const oviceUrlPattern = /^https:\/\/[a-zA-Z0-9-]+\.ovice\.in\/.*$/;
  return oviceUrlPattern.test(url);
}

function sendCheckButtonMessage() {
  sendMessageToOviceTab({ message: "check_button" });
}

function sendClickButtonMessage() {
  sendMessageToOviceTab({ message: "click_button" });
}

function sendMessageToOviceTab(message) {
  chrome.tabs.query({}, function (tabs) {
    for (const tab of tabs) {
      if (isOviceUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log("Message sent successfully");
          }
        });
        return;
      }
    }
  });
}

async function requestCheckButton() {
  const hasOvice = await hasOviceTab();
  if (hasOvice) {
    sendCheckButtonMessage();
  } else {
    updateExtensionIcon(false, true);
  }
}

function updateExtensionIcon(isOn, isDisabled) {
  globalIconState.isOn = isOn;
  globalIconState.isDisabled = isDisabled;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    if (activeTab) {
      updateExtensionIconImpl(activeTab.id, globalIconState)
    }
  });
}

function updateExtensionIconImpl(tabId, iconState) {
  const iconPath = iconState.isDisabled
    ? "../image/icon_disable.png"
    : iconState.isOn
    ? "../image/icon_on.png"
    : "../image/icon_off.png";

  chrome.action.setIcon({ tabId: tabId, path: iconPath });
}

async function hasOviceTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (isOviceUrl(tab.url)) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    });
  });
}

async function reloadOviceTabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (isOviceUrl(tab.url)) {
        chrome.tabs.reload(tab.id);
      }
    }
  });
}