class StorageManager {

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

class InputManager {

  static DEFAULT_MICROPHONE_XPATH = '//*[@id="MenuBar"]/div[2]/div[1]/button';

  constructor(storageManager) {
    this.storageManager = storageManager;
    this.spaceUrlInput = document.getElementById('spaceUrl');
    this.microphoneXPathInput = document.getElementById('microphoneXPath');
  }

  init() {
    const form = document.getElementById('settingsForm');
    form.addEventListener('submit', (event) => this.onSubmit(event));
    this.setMicrophoneXPathPlaceholder(InputManager.DEFAULT_MICROPHONE_XPATH);
    this.reload();
  }

  async reload() {
    let data = await storageManager.getStorageData(['spaceUrl', 'microphoneXPath']);

    if (data.spaceUrl !== undefined) {
      this.spaceUrlInput.value = data.spaceUrl;
    }

    if (data.microphoneXPath !== undefined) {
      this.microphoneXPathInput.value = data.microphoneXPath;
    } else {
      this.microphoneXPathInput.value = InputManager.DEFAULT_MICROPHONE_XPATH;
    }
  }

  onSubmit(event) {
    let spaceUrl = extractSpaceUrl(this.spaceUrlInput.value);
    let microphoneXPath = this.microphoneXPathInput.value;
  
    if (!validateSpaceUrl(spaceUrl)) {
      event.preventDefault();
      return;
    }
    if (!validateMicrophoneXPath(microphoneXPath)) {
      event.preventDefault();
      return;
    }
  
    event.preventDefault();
    storageManager.setStorageData({
      'spaceUrl': spaceUrl,
      'microphoneXPath': microphoneXPath
    });
  
    chrome.runtime.sendMessage({ message: "reload_ovice_tabs" });
    alert('保存されました。');
    this.reload();
  }

  setMicrophoneXPathPlaceholder(placeholder) {
    if (this.microphoneXPathInput) {
      this.microphoneXPathInput.setAttribute('placeholder', placeholder);
    }
  }
}

function extractSpaceUrl(url) {
  // https://<スペースドメイン>.ovice.in
  let regex = /^(https:\/\/[a-zA-Z0-9-]{3,}\.ovice\.in)/;
  let match = url.match(regex);

  // https://app.rc.ovice.com/ws/<スペースドメイン>
  if (!match) {
    regex = /^(https:\/\/app\.rc\.ovice\.com\/ws\/[a-zA-Z0-9-]{3,})$/;
    match = url.match(regex);
  }

  if (match) {
    return `${match[0]}/`
  }
  return undefined
}

function validateSpaceUrl(url) {
  if (url === undefined) {
    alert('無効なスペースURLです。');
    return false;
  }
  return true;
}

function validateMicrophoneXPath(xpath) {
  const xpathAllowedPattern = /^[a-zA-Z0-9\s\-_/.*@[\]():,'"=|]+$/;
  if (!xpathAllowedPattern.test(xpath)) {
    alert('xPathで使用できない文字が含まれています。');
    return false;
  }
  return true;
}

let storageManager = new StorageManager()
let inputManager = new InputManager(storageManager)
document.addEventListener('DOMContentLoaded', () => {
  inputManager.init();
});