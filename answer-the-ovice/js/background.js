chrome.action.onClicked.addListener(async () => {
  // 全てのタブを取得する
  chrome.tabs.query({}, function (tabs) {
    // 全てのタブについて繰り返す
    for (const tab of tabs) {
      // タブのURLが https://*** */ の場合
      if (tab.url.startsWith('https://***')) {
        // タブにメッセージを送信してボタンを押す
        chrome.tabs.sendMessage(tab.id, { message: 'click_button' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log('Message sent successfully');
          }
        });
        
      }
    }
  });
});

  
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'update_icon') {
    updateExtensionIcon(request.isOn, request.disabled);
  }
});
  
chrome.tabs.onActivated.addListener(() => {
  updateExtensionIcon(false, false);
});
  
function updateExtensionIcon(isOn, isDisabled) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    if (activeTab) {
      const iconPath = isDisabled
        ? '../image/icon_disable.png'
        : isOn
        ? '../image/icon_on.png'
        : '../image/icon_off.png';
  
      chrome.action.setIcon({ tabId: activeTab.id, path: iconPath });
    }
  });
}
  