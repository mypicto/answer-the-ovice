chrome.action.onClicked.addListener(async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, { message: 'click_button' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Error:', chrome.runtime.lastError.message);
          } else {
            console.log('Response:', response);
          }
        });
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
  