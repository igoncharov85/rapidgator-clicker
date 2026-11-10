(function (root) {
  "use strict";

  function visible(element) {
    if (!element || !element.isConnected || element.getClientRects().length === 0) return false;
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    return style.visibility !== "hidden" && style.visibility !== "collapse" && style.display !== "none";
  }

  function enabled(element) {
    return visible(element) && !element.disabled &&
      element.getAttribute("aria-disabled") !== "true" && !element.classList.contains("disabled");
  }

  function label(element) {
    return (element.textContent || element.value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function inspect(document) {
    const finalButton = Array.from(document.querySelectorAll("a, button, input[type='submit'], input[type='button']"))
      .find(element => enabled(element) && label(element) === "click here to download");
    if (finalButton) return { stage: "download", status: "Ready to click the download button", target: finalButton };

    const restricted = Array.from(document.querySelectorAll(".download-prepare, .main-block"))
      .some(element => visible(element) &&
        /can be downloaded only by subscribers with solo subscription/i.test(
          (element.innerText ?? element.textContent ?? "").replace(/\s+/g, " ")
        ));
    const form = document.querySelector("form#captchaform");
    if (form) {
      const tokens = form.querySelectorAll(
        '[name="cf-turnstile-response"], [name="g-recaptcha-response"], [name="h-captcha-response"], ' +
        '#DownloadCaptchaForm_verifyCode, [name="DownloadCaptchaForm[verifyCode]"]'
      );
      const completed = Array.from(tokens).some(element => (element.value || "").trim().length > 0);
      const submit = form.querySelector("#submit-button");
      if (completed && enabled(submit)) {
        return { stage: "captcha", status: "CAPTCHA completed; ready to click Send", target: submit };
      }
      return { stage: "captcha", status: "Waiting for CAPTCHA completion" };
    }

    const timer = document.querySelector(".download-timer-seconds");
    if (visible(timer)) {
      const raw = timer.textContent.trim();
      const seconds = /^\d+$/.test(raw) ? Number(raw) : null;
      if (seconds === null || seconds > 0) {
        return { stage: "timer", status: seconds === null ? "Waiting for the countdown" : `Waiting: ${seconds} seconds` };
      }
      const free = document.querySelector("a.btn-free");
      // Rapidgator normally redirects itself; only click a revealed, usable link.
      if (enabled(free) && !/^(starting|wait)/.test(label(free))) {
        return { stage: "continue", status: "Countdown finished; continuing", target: free };
      }
      return { stage: "timer", status: "Countdown finished; waiting for Rapidgator to continue" };
    }
    if (restricted) {
      return { stage: "notice", status: "Publisher subscription notice shown; try Slow Speed Download" };
    }
    if (enabled(document.querySelector("a.btn-free"))) {
      return { stage: "idle", status: "Click Slow Speed Download to start the countdown" };
    }
    return { stage: "idle", status: "Waiting for a countdown, CAPTCHA form, or download button" };
  }

  const api = { inspect };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RapidgatorFlow = api;
})(globalThis);
