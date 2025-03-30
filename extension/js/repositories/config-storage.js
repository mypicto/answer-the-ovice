/**
 * ConfigStorage - Chrome拡張機能のストレージ操作を管理するクラス
 */
class ConfigStorage {
  /**
   * 過去バージョンのデータを新しい形式に移行する
   */
  async migration() {
    const data = await this.getStorageData(['spaceDomain', 'spaceUrl']);
    if (data.spaceDomain && (!data.spaceUrl || data.spaceUrl === '')) {
      const newSpaceUrl = `https://${data.spaceDomain}.ovice.in/`;
      await this.setStorageData({ 'spaceUrl': newSpaceUrl });
    }
  }

  /**
   * 指定したキーのデータをストレージから取得する
   * @param {string|string[]} keys - 取得したいデータのキー
   * @returns {Promise<Object>} - 取得したデータ
   */
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
  
  /**
   * データをストレージに保存する
   * @param {Object} items - 保存するデータ
   * @returns {Promise<void>}
   */
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

  /**
   * マイクXPathを取得する
   * @returns {Promise<string|undefined>} マイクのXPath
   */
  async getMicrophoneXPath() {
    const data = await this.getStorageData(['microphoneXPath']);
    return data.microphoneXPath;
  }

  /**
   * スペースURLを取得する
   * @returns {Promise<string|undefined>} スペースURL
   */
  async getSpaceUrl() {
    const data = await this.getStorageData(['spaceUrl']);
    return data.spaceUrl;
  }
}

// ES Modules環境とCommonJSとブラウザ環境の両方でエクスポートできるようにする
if (typeof exports !== 'undefined') {
  exports.ConfigStorage = ConfigStorage;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigStorage };
    module.exports.ConfigStorage = ConfigStorage;
  }
} else if (typeof window !== 'undefined') {
  window.ConfigStorage = ConfigStorage;
} else if (typeof self !== 'undefined') {
  self.ConfigStorage = ConfigStorage;
} else if (typeof globalThis !== 'undefined') {
  globalThis.ConfigStorage = ConfigStorage;
}