document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm');
  const spaceUrlInput = document.getElementById('spaceUrl');
  const microphoneXPathInput = document.getElementById('microphoneXPath');
  const xpathAllowedPattern = /^[a-zA-Z0-9\s\-_/.*@[\]():,'"=|]+$/;

  // Load the current values from storage
  chrome.storage.sync.get(['spaceUrl', 'microphoneXPath'], (data) => {
    if (data.spaceUrl !== undefined) {
      spaceUrlInput.value = data.spaceUrl;
    }
    if (data.microphoneXPath !== undefined) {
      microphoneXPathInput.value = data.microphoneXPath;
    } else {
      microphoneXPathInput.value = '//*[@id="MenuBar"]/div[2]/div[1]/button';
    }
  });

  // Save the values to storage when the form is submitted
  form.addEventListener('submit', (event) => {

    spaceUrl = extractSpaceUrl(spaceUrlInput.value);

    if (spaceUrl === undefined) {
      alert('無効なスペースURLです。');
      return;
    }
    if (!xpathAllowedPattern.test(microphoneXPathInput.value)) {
      alert('xPathで使用できない文字が含まれています。');
      return;
    }

    event.preventDefault();
    chrome.storage.sync.set({
      spaceUrl: spaceUrl,
      microphoneXPath: microphoneXPathInput.value
    }, () => {
      console.log('Space url saved:', spaceUrl);
      console.log('Microphone xPath saved:', microphoneXPathInput.value);
      chrome.runtime.sendMessage({ message: "reload_ovice_tabs" });
      alert('保存されました。');
      spaceUrlInput.value = spaceUrl;
    });
  });
});

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