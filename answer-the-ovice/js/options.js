document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settingsForm');
  const spaceDomainInput = document.getElementById('spaceDomain');
  const validInput = /^[a-zA-Z0-9-]{3,}$/;

  // Load the current value from storage
  chrome.storage.sync.get('spaceDomain', (data) => {
    if (data.spaceDomain) {
      spaceDomainInput.value = data.spaceDomain;
    }
  });

  // Save the value to storage when the form is submitted
  form.addEventListener('submit', (event) => {

    if (!validInput.test(spaceDomainInput.value)) {
      alert('無効なスペースドメインです。英数字3文字以上で、記号はハイフンのみ利用可能です。');
      return;
    }

    event.preventDefault();
    chrome.storage.sync.set({ spaceDomain: spaceDomainInput.value }, () => {
      console.log('Space domain saved:', spaceDomainInput.value);
      chrome.runtime.sendMessage({ message: "reload_ovice_tabs" });
      alert('保存されました。');
    });
  });
});
