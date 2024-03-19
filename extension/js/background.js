class StorageManager {

  async migration() {
    const data = await this.getStorageData(['spaceDomain', 'spaceUrl']);
    if (data.spaceDomain && (!data.spaceUrl || data.spaceUrl === '')) {
      const newSpaceUrl = `https://${data.spaceDomain}.ovice.in/`;
      await this.setStorageData({ 'spaceUrl': newSpaceUrl });
    }
  }

  async getStorageData(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }
  
  async setStorageData(items) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

class OviceTabManager {

  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  async getSpaceUrl() {
    let data = await this.storageManager.getStorageData(['spaceUrl']);
    if (data.spaceUrl) {
      return data.spaceUrl;
    } else {
      return undefined;
    }
  }

  async reloadOviceTabs() {
    let tabId = await this.getOviceTabId();
    chrome.tabs.reload(tabId);
  }

  async activeOviceTab() {
    let tabId = await this.getOviceTabId();
    if (tabId !== undefined) {
      chrome.tabs.update(tabId, { active: true });
    }
  }

  async hasOviceTab() {
    let tabId = await this.getOviceTabId();
    return tabId !== undefined;
  }

  async getOviceTabId() {
    return new Promise((resolve) => {
      this.getSpaceUrl().then((oviceUrl) => {
        chrome.tabs.query({}, (tabs) => {
          for (const tab of tabs) {
            if (this.isOviceTab(tab, oviceUrl)) {
              resolve(tab.id);
              return;
            }
          }
          resolve(undefined);
        });
      });
    });
  }

  isOviceTab(tab, oviceUrl) {
    let discarded = tab.discarded;
    let isOvice = tab.url.startsWith(oviceUrl);
    return !discarded && isOvice;
  }

}

class MessageManager {

  constructor(oviceTabManager) {
    this.oviceTabManager = oviceTabManager;
  }

  sendCheckButtonMessage() {
    this.sendMessageToOviceTab({ message: "check_button" });
  }
  
  sendClickButtonMessage() {
    this.sendMessageToOviceTab({ message: "click_microphone_button" });
  }

  sendMessageToOviceTab(message) {
    this.oviceTabManager.getSpaceUrl().then((oviceUrl) => {
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (this.oviceTabManager.isOviceTab(tab, oviceUrl)) {
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

}

class IconManager {

  constructor() {
    this.iconState = {
      isOn: false,
      isDisabled: false,
    };
  }

  update(isOn, isDisabled) {
    this.iconState.isOn = isOn;
    this.iconState.isDisabled = isDisabled;
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        this.refresh(activeTab.id)
      }
    });
  }
  
  refresh(tabId) {
    const iconPath =  this.iconState.isDisabled
      ? "../image/icon_disable.png"
      :  this.iconState.isOn
      ? "../image/icon_on.png"
      : "../image/icon_off.png";
  
    chrome.action.setIcon({ tabId: tabId, path: iconPath });
  }

  isStateOff() {
    return !this.iconState.isOn && !this.iconState.isDisabled;
  }

}

class EventListenerManager {

  constructor(storageManager, oviceTabManager, messageManager, iconManager) {
    this.storageManager = storageManager;
    this.oviceTabManager = oviceTabManager;
    this.messageManager = messageManager;
    this.iconManager = iconManager;
  }

  addEventListener() {

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete") {
        this.requestCheckButton().then();
      }
    });
    
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.oviceTabManager.getSpaceUrl().then((oviceUrl) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          if (tab && !this.oviceTabManager.isOviceTab(tab, oviceUrl)) {
            this.iconManager.refresh(activeInfo.tabId);
          }
        });
      });
    });
    
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
      this.requestCheckButton();
    });
    
    chrome.action.onClicked.addListener(async () => {
      this.messageManager.sendClickButtonMessage();
      this.oviceTabManager.activeOviceTab();
    });

    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "toggle-microphone") {
        this.messageManager.sendClickButtonMessage();
      } else if (command === "toggle-microphone-and-active-tab") {
        this.messageManager.sendClickButtonMessage();
        this.oviceTabManager.activeOviceTab();
      }
    });
    
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        chrome.tabs.create({ url: '../html/options.html' });
      } else if (details.reason === 'update') {
        this.storageManager.migration();
        this.oviceTabManager.reloadOviceTabs();
      }
    });
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.message === 'update_icon') {
        this.iconManager.update(request.isOn, request.disabled);
      } else if (request.message === 'reload_ovice_tabs') {
        this.oviceTabManager.reloadOviceTabs();
      }
    });

  }

  async requestCheckButton() {
    const hasOvice = await this.oviceTabManager.hasOviceTab();
    if (hasOvice) {
      this.messageManager.sendCheckButtonMessage();
    } else {
      this.iconManager.update(false, true);
    }
  }
}

let storageManager = new StorageManager()
let oviceTabManager = new OviceTabManager(storageManager);
let messageManager = new MessageManager(oviceTabManager);
let iconManager = new IconManager();
let eventListenerManager = new EventListenerManager(storageManager, oviceTabManager, messageManager, iconManager);

eventListenerManager.addEventListener();