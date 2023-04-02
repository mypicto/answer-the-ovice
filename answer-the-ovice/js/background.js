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

  getOveceUrl().then((oviceUrl) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (!tab.url.startsWith(oviceUrl)) {
        updateExtensionIconImpl(activeInfo.tabId, globalIconState);
      }
    });
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

function sendCheckButtonMessage() {
  sendMessageToOviceTab({ message: "check_button" });
}

function sendClickButtonMessage() {
  sendMessageToOviceTab({ message: "click_button" });
}

function sendMessageToOviceTab(message) {
  getOveceUrl().then((oviceUrl) => {
    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (tab.url.startsWith(oviceUrl)) {
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
  const oviceUrl = await getOveceUrl();

  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.url.startsWith(oviceUrl)) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    });
  });
}

async function reloadOviceTabs() {
  const oviceUrl = await getOveceUrl();

  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.url.startsWith(oviceUrl)) {
        chrome.tabs.reload(tab.id);
      }
    }
  });
}