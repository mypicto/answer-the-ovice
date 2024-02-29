class OviceTabManager {

  async getOveceUrl() {
    const spaceDomain = await this.getSpaceDomain();
    return `https://${spaceDomain}.ovice.in/`;
  }

  async getSpaceDomain() {
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
      this.getOveceUrl().then((oviceUrl) => {
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
    this.oviceTabManager.getOveceUrl().then((oviceUrl) => {
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
      ? "../image/icon_on_green.png"
      : "../image/icon_off.png";
  
    chrome.action.setIcon({ tabId: tabId, path: iconPath });
  }

  isStateOff() {
    return !this.iconState.isOn && !this.iconState.isDisabled;
  }

}

class EventListenerManager {

  constructor(oviceTabManager, messageManager, iconManager) {
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
      this.oviceTabManager.getOveceUrl().then((oviceUrl) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          if (!this.oviceTabManager.isOviceTab(tab, oviceUrl)) {
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
    });

    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "toggle-microphone") {
        this.messageManager.sendClickButtonMessage();
        if (this.iconManager.isStateOff()) {
          this.oviceTabManager.activeOviceTab();
        }
      }
    });
    
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        chrome.tabs.create({ url: '../html/options.html' });
      } else if (details.reason === 'update') {
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

let oviceTabManager = new OviceTabManager();
let messageManager = new MessageManager(oviceTabManager);
let iconManager = new IconManager();
let eventListenerManager = new EventListenerManager(oviceTabManager, messageManager, iconManager);

eventListenerManager.addEventListener();