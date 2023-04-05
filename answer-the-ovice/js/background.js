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
      if (!isOviceTab(tab, oviceUrl)) {
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

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: '../html/options.html' });
  } else if (details.reason === 'update') {
    reloadOviceTabs();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'update_icon') {
    updateExtensionIcon(request.isOn, request.disabled);
  } else if (request.message === 'reload_ovice_tabs') {
    reloadOviceTabs();
  }
});

//
// PCがロックされたら離席
//
const idleInterval = 20;
let isCurrentStateLocked = false;

function checkIdleState() {
  chrome.idle.queryState(idleInterval, (state) => {
    isStateLocked = state === "locked";
    if (isCurrentStateLocked !== isStateLocked) {
      // 状態が変化した場合のみログを出力
      isCurrentStateLocked = isStateLocked;
      const currentDateTime = new Date().toLocaleString();
      
      if (isStateLocked) {
        console.log(`[${currentDateTime}] User is locked from the computer`);
        sendChangeLeavingMessage();
      } else {
        console.log(`[${currentDateTime}] User is active at the computer`);
      }
    }
  });

  // 次の状態確認をスケジュール
  setTimeout(checkIdleState, idleInterval * 1000);
}

// 最初の状態確認を開始
checkIdleState();

function isOviceTab(tab, oviceUrl) {
  let discarded = tab.discarded;
  let isOvice = tab.url.startsWith(oviceUrl);
  return !discarded && isOvice;
}

function sendCheckButtonMessage() {
  sendMessageToOviceTab({ message: "check_button" });
}

function sendClickButtonMessage() {
  sendMessageToOviceTab({ message: "click_microphone_button" });
}

function sendChangeLeavingMessage() {
  sendMessageToOviceTab({ message: "change_leaving" });
}

function sendMessageToOviceTab(message) {
  getOveceUrl().then((oviceUrl) => {
    chrome.tabs.query({}, function (tabs) {
      for (const tab of tabs) {
        if (isOviceTab(tab, oviceUrl)) {
          chrome.tabs.sendMessage(tab.id, message, (response) => {
            if (chrome.runtime.lastError) {
              console.info(chrome.runtime.lastError.message);
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
    ? "../image/icon_on_green.png"
    : "../image/icon_off.png";

  chrome.action.setIcon({ tabId: tabId, path: iconPath });
}

async function hasOviceTab() {
  return new Promise((resolve) => {
    getOveceUrl().then((oviceUrl) => {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (isOviceTab(tab, oviceUrl)) {
            resolve(true);
            return;
          }
        }
        resolve(false);
      });
    });
  });
}

async function reloadOviceTabs() {
  getOveceUrl().then((oviceUrl) => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (isOviceTab(tab, oviceUrl)) {
          chrome.tabs.reload(tab.id);
        }
      }
    });
  });
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