(() => {
  "use strict";
  let enabled = false;
  let status = "Starting…";
  const clicked = new Set();
  let scheduled = false;

  function check() {
    scheduled = false;
    if (!enabled) {
      status = "Paused";
      return;
    }
    const state = RapidgatorFlow.inspect(document);
    status = state.status;
    if (clicked.has(state.stage)) {
      status = state.stage === "download"
        ? "Download button clicked; check Chrome’s downloads"
        : "Send/continue clicked; waiting for the next page";
      return;
    }
    if (state.target) {
      // Record before clicking: synchronous page changes must not trigger duplicates.
      clicked.add(state.stage);
      state.target.click();
      status = state.stage === "download"
        ? "Download button clicked; check Chrome’s downloads"
        : "Send/continue clicked; waiting for the next page";
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(check, 100);
  }

  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message.type === "getStatus") respond({ enabled, status });
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      enabled = changes.enabled.newValue !== false;
      check();
    }
  });
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ["value", "style", "class", "disabled", "aria-disabled", "hidden"]
  });
  // CAPTCHA callbacks often assign input.value without a DOM mutation.
  setInterval(check, 1000);
  document.addEventListener("input", schedule, true);
  document.addEventListener("change", schedule, true);
  window.addEventListener("pageshow", schedule);
  chrome.storage.local.get({ enabled: true }).then(settings => {
    enabled = settings.enabled;
    check();
  });
})();
