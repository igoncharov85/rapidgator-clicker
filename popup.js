"use strict";
const toggle = document.getElementById("enabled");
const statusText = document.getElementById("status");

async function refresh() {
  const settings = await chrome.storage.local.get({ enabled: true });
  toggle.checked = settings.enabled;
  if (!settings.enabled) {
    statusText.textContent = "Paused";
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.tabs.sendMessage(tab.id, { type: "getStatus" });
    statusText.textContent = result.status;
  } catch {
    statusText.textContent = "Open a Rapidgator tab. If it was already open when you installed the extension, reload it.";
  }
}
toggle.addEventListener("change", async () => {
  await chrome.storage.local.set({ enabled: toggle.checked });
  await refresh();
});
refresh();
setInterval(refresh, 1000);
