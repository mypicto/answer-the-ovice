import './repositories/config-storage.js';
const { ConfigStorage } = globalThis;

class TabService {
  constructor(configStorage) {
    this.configStorage = configStorage;
  }

  async getSpaceUrl() {
    return await this.configStorage.getSpaceUrl();
  }

  async reloadOviceTabs() {
    let tabId = await this.getOviceTabId();
    if (tabId !== undefined) {
      chrome.tabs.reload(tabId);
    }
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
    if (!oviceUrl || !tab.url) return false;
    let discarded = tab.discarded;
    let isOvice = tab.url.startsWith(oviceUrl);
    return !discarded && isOvice;
  }
}

class MessageService {
  constructor(tabService) {
    this.tabService = tabService;
  }

  sendCheckButtonMessage() {
    this.sendMessageToOviceTab({ message: "check_button" });
  }
  
  sendClickButtonMessage() {
    this.sendMessageToOviceTab({ message: "click_microphone_button" });
  }

  sendMessageToOviceTab(message) {
    this.tabService.getSpaceUrl().then((oviceUrl) => {
      if (!oviceUrl) return;
      
      chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
          if (this.tabService.isOviceTab(tab, oviceUrl)) {
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

class IconComponent {
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
        this.refresh(activeTab.id);
      }
    });
  }
  
  refresh(tabId) {
    const iconPath = this.iconState.isDisabled
      ? "../image/icon_disable.png"
      : this.iconState.isOn
        ? "../image/icon_on.png"
        : "../image/icon_off.png";
  
    chrome.action.setIcon({ tabId: tabId, path: iconPath });
  }

  isStateOff() {
    return !this.iconState.isOn && !this.iconState.isDisabled;
  }
}

class AppController {
  constructor(configStorage, tabService, messageService, iconComponent) {
    this.configStorage = configStorage;
    this.tabService = tabService;
    this.messageService = messageService;
    this.iconComponent = iconComponent;
  }

  initialize() {
    this.setupTabListeners();
    this.setupCommandListeners();
    this.setupRuntimeListeners();
  }

  setupTabListeners() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete") {
        this.requestCheckButton();
      }
    });
    
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.tabService.getSpaceUrl().then((oviceUrl) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          if (tab && !this.tabService.isOviceTab(tab, oviceUrl)) {
            this.iconComponent.refresh(activeInfo.tabId);
          }
        });
      });
    });
    
    chrome.tabs.onRemoved.addListener(() => {
      this.requestCheckButton();
    });
    
    chrome.action.onClicked.addListener(() => {
      this.messageService.sendClickButtonMessage();
      this.tabService.activeOviceTab();
    });
  }

  setupCommandListeners() {
    chrome.commands.onCommand.addListener((command) => {
      if (command === "toggle-microphone") {
        this.messageService.sendClickButtonMessage();
      } else if (command === "toggle-microphone-and-active-tab") {
        this.messageService.sendClickButtonMessage();
        this.tabService.activeOviceTab();
      }
    });
  }

  setupRuntimeListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        chrome.tabs.create({ url: '../html/options.html' });
      } else if (details.reason === 'update') {
        this.configStorage.migration();
        this.tabService.reloadOviceTabs();
      }
    });
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.message === 'update_icon') {
        this.iconComponent.update(request.isOn, request.disabled);
      } else if (request.message === 'reload_ovice_tabs') {
        this.tabService.reloadOviceTabs();
      }
    });
  }

  async requestCheckButton() {
    const hasOvice = await this.tabService.hasOviceTab();
    if (hasOvice) {
      this.messageService.sendCheckButtonMessage();
    } else {
      this.iconComponent.update(false, true);
    }
  }
}

function initializeApp() {
  const configStorage = new ConfigStorage();
  const tabService = new TabService(configStorage);
  const messageService = new MessageService(tabService);
  const iconComponent = new IconComponent();
  const appController = new AppController(configStorage, tabService, messageService, iconComponent);

  appController.initialize();
}

initializeApp();