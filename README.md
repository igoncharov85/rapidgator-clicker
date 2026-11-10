# Rapidgator Click

A small Chrome Manifest V3 extension for the flow in your screenshots:

1. Start a free download yourself.
2. The extension observes `.download-timer-seconds` and lets Rapidgator finish its countdown and redirect. If a free-download link becomes available at zero, it clicks it.
3. On `form#captchaform`, it waits for a populated CAPTCHA response field, then clicks `#submit-button` (Send).
4. When a visible button/link reads **CLICK HERE TO DOWNLOAD**, it clicks it once.

CAPTCHAs remain handled by the site or by you. The extension does not solve them or skip the wait. Chrome still controls download prompts and where files are saved.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the cloned or extracted project folder.
4. Reload any Rapidgator tabs that were already open.
5. Start a free download and leave its tab open. Pin the extension to view its status or pause automation.

Enabled by default. It operates only on HTTPS `rapidgator.net` and `www.rapidgator.net` pages, in the top frame. It requests only storage permission to remember the on/off setting. No build, account credentials, background service, or network calls are needed.

Publisher subscription notices are shown in the popup when detected before starting. Such a notice alone does not prove the free download is blocked: try Slow Speed Download. An active countdown or download takes precedence over the notice. Hidden countdown elements do not count as an active countdown.

Each action is attempted once per page load to prevent duplicate submissions/downloads. If a submission fails or a CAPTCHA expires, complete the CAPTCHA and click Send manually, or reload the page to reset the extension. Pausing and resuming does not reset completed actions. Chrome may throttle timers in background tabs; closing or discarding a tab stops monitoring until it loads again.

## Verify

Run `npm test` (Node.js 18+; no dependencies). Tests cover timer readiness, publisher notices, CAPTCHA gating, hidden/disabled controls, exact final-button matching, and duplicate-click prevention. On November 10, 2026, the user confirmed the live flow worked and supplied screenshots showing the active countdown and final download click. File download completion is not independently tracked by the extension. If the site's markup changes, update `flow.js`.

## Update

After changing these files, click Reload on Rapidgator Click in `chrome://extensions`, then reload open Rapidgator tabs. Version 1.0.3 includes the approved orange and black icon with the darker orange patch removed.

## Icon

The icon is an AI-redrawn borderless adaptation of Rapidgator's favicon, made with the built-in image generation tool. The original favicon was downloaded from https://rapidgator.net/favicon.ico on November 10, 2026 and is preserved in `icons/rapidgator-original.ico`. The approved source is `icons/icon-flat-source.png`; PNG variants are resized for Chrome. The edit prompt is recorded in `icons/prompt-flat.txt`. Branding belongs to its respective owner. This is an unofficial personal extension.
