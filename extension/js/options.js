document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm');
  const spaceDomainInput = document.getElementById('spaceDomain');
  const microphoneXPathInput = document.getElementById('microphoneXPath');
  const validInput = /^[a-zA-Z0-9-]{3,}$/;
  const xpathAllowedPattern = /^[a-zA-Z0-9\s\-_/.*@[\]():,'"=|]+$/;

  // Load the current values from storage
  chrome.storage.sync.get(['spaceDomain', 'microphoneXPath'], (data) => {
    if (data.spaceDomain !== undefined) {
      spaceDomainInput.value = data.spaceDomain;
    }
    if (data.microphoneXPath !== undefined) {
      microphoneXPathInput.value = data.microphoneXPath;
    } else {
      microphoneXPathInput.value = '//*[@id="MenuBar"]/div[2]/div[1]/button';
    }
  });

  // Save the values to storage when the form is submitted
  form.addEventListener('submit', (event) => {

    spaceDomain = extractSpaceDomain(spaceDomainInput.value);

    if (!validInput.test(spaceDomain)) {
      alert('無効なスペースドメインです。英数字3文字以上で、記号はハイフンのみ利用可能です。');
      return;
    }
    if (!xpathAllowedPattern.test(microphoneXPathInput.value)) {
      alert('xPathで使用できない文字が含まれています。');
      return;
    }

    event.preventDefault();
    chrome.storage.sync.set({
      spaceDomain: spaceDomain,
      microphoneXPath: microphoneXPathInput.value
    }, () => {
      console.log('Space domain saved:', spaceDomain);
      console.log('Microphone xPath saved:', microphoneXPathInput.value);
      chrome.runtime.sendMessage({ message: "reload_ovice_tabs" });
      alert('保存されました。');
      spaceDomainInput.value = spaceDomain;
    });
  });
});

function extractSpaceDomain(url) {
  // https://<スペースドメイン>.ovice.in
  let regex = /([^\/]+)\.ovice\.in/;
  let match = url.match(regex);

  // https://app.rc.ovice.com/ws/<スペースドメイン>
  if (!match) {
    regex = /app\.rc\.ovice\.com\/ws\/([^\/]+)/;
    match = url.match(regex);
  }

  return match ? match[1] : url;
}