document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm');
  const spaceDomainInput = document.getElementById('spaceDomain');
  const systemLockInput = document.getElementById('systemLock');
  const validInput = /^[a-zA-Z0-9-]{3,}$/;

  // Load the current values from storage
  chrome.storage.sync.get(['spaceDomain', 'systemLock'], (data) => {
    if (data.spaceDomain) {
      spaceDomainInput.value = data.spaceDomain;
    }
    if (data.systemLock !== undefined) {
      systemLockInput.checked = data.systemLock;
    }
  });

  // Save the values to storage when the form is submitted
  form.addEventListener('submit', (event) => {

    if (!validInput.test(spaceDomainInput.value)) {
      alert('無効なスペースドメインです。英数字3文字以上で、記号はハイフンのみ利用可能です。');
      return;
    }

    event.preventDefault();
    chrome.storage.sync.set({
      spaceDomain: spaceDomainInput.value,
      systemLock: systemLockInput.checked
    }, () => {
      console.log('Space domain saved:', spaceDomainInput.value);
      console.log('System lock setting saved:', systemLockInput.checked);
      chrome.runtime.sendMessage({ message: "reload_ovice_tabs" });
      alert('保存されました。');
    });
  });
});
