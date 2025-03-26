class MessageHandler {
  static initialize() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.message === 'click_microphone_button') {
        MicrophoneController.clickButton();
        sendResponse({});
      } else if (request.message === 'check_button') {
        MicrophoneController.checkStatus();
        sendResponse({});
      }
    });
  }

  static sendToBackground(message) {
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
}

class ConfigStorage {
  static async getMicrophoneXPath() {
    return new Promise((resolve) => {
      if (chrome.runtime.lastError) {
        resolve(undefined);
        return;
      }
      
      chrome.storage.sync.get("microphoneXPath", (data) => {
        resolve(data.microphoneXPath);
      });
    });
  }

  static async getSpaceUrl() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("spaceUrl", (data) => {
        if (data.spaceUrl) {
          resolve(data.spaceUrl);
        } else {
          resolve(undefined);
        }
      });
    });
  }
}

class MicrophoneButtonComponent {
  static async getButton() {
    const xpath = await ConfigStorage.getMicrophoneXPath();
    if (xpath) {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    return undefined;
  }
  
  static async getButtonStatus() {
    const button = await this.getButton();
    
    if (button) {
      const isOn = button.getAttribute('data-status') === 'true';
      return isOn;
    }
    return undefined;
  }
  
  static async clickButton() {
    const button = await this.getButton();
    if (button) {
      button.click();
    }
  }
  
  static observeButtonChanges(onButtonChange) {
    return async () => {
      const button = await this.getButton();
      
      if (button) {
        const config = { attributes: true, childList: false, subtree: false };
        const callback = (mutationsList, observer) => {
          for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              onButtonChange();
            }
          }
        };
        const observer = new MutationObserver(callback);
        observer.observe(button, config);
        return true;
      }
      return false;
    };
  }
}

class MicrophoneController {
  static retryCount = 0;
  static maxRetries = 60;
  static retryInterval = 1000;

  static async checkStatus() {
    const isOn = await MicrophoneButtonComponent.getButtonStatus();
    if (isOn === undefined) {
      MessageHandler.sendToBackground({ message: 'update_icon', isOn: false, disabled: true });
    } else {
      MessageHandler.sendToBackground({ message: 'update_icon', isOn: isOn, disabled: false });
    }
  }

  static async clickButton() {
    await MicrophoneButtonComponent.clickButton();
  }

  static async observeButton() {
    const setupObserver = MicrophoneButtonComponent.observeButtonChanges(() => this.checkStatus());
    const observerSetup = await setupObserver();

    if (observerSetup) {
      this.checkStatus();
      this.retryCount = 0;
    } else {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => {
          this.observeButton();
        }, this.retryInterval);
      } else {
        console.info(`Failed to find targetNode after ${this.maxRetries} retries`);
      }
    }
  }
}

class AppInitializer {
  static async initialize() {
    const oviceUrl = await ConfigStorage.getSpaceUrl();
    if (oviceUrl && window.location.href.startsWith(oviceUrl)) {
      MicrophoneController.observeButton();
      MicrophoneController.checkStatus();
      window.addEventListener('focus', () => {
        MicrophoneController.checkStatus();
      });
    }
  }
}

// アプリケーションを初期化
MessageHandler.initialize();
AppInitializer.initialize();