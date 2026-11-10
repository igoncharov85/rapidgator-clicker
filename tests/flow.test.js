const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { inspect } = require("../flow.js");

function element(text = "", options = {}) {
  return {
    textContent: text, value: "", isConnected: true, disabled: false,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ visibility: "visible", display: "block" }) } },
    getClientRects: () => options.hidden ? [] : [{}],
    getAttribute: name => options[name] || null,
    classList: { contains: name => Boolean(options[name]) },
    ...options
  };
}

function page({ seconds, free, tokens = [], submit, buttons = [], captcha = false, notices = [], timerHidden = false } = {}) {
  const timer = seconds === undefined ? null : element(String(seconds), { hidden: timerHidden });
  const form = captcha ? {
    querySelectorAll: () => tokens,
    querySelector: selector => selector === "#submit-button" ? submit : null
  } : null;
  return {
    querySelectorAll: selector => selector === ".download-prepare, .main-block" ? notices : buttons,
    querySelector: selector => ({
      ".download-timer-seconds": timer, "a.btn-free": free, "form#captchaform": form
    })[selector] || null
  };
}

test("positive countdown never clicks the free button", () => {
  const state = inspect(page({ seconds: 134, free: element("Free download") }));
  assert.equal(state.target, undefined);
  assert.match(state.status, /134 seconds/);
});

test("zero countdown only clicks a visible, enabled free button", () => {
  const free = element("Free download");
  assert.equal(inspect(page({ seconds: 0, free })).target, free);
  for (const options of [{ hidden: true }, { disabled: true }, { "aria-disabled": "true" }]) {
    assert.equal(inspect(page({ seconds: 0, free: element("Free download", options) })).target, undefined);
  }
  assert.equal(inspect(page({ seconds: 0, free: element("Starting…") })).target, undefined);
});

test("unknown timer text does not count as zero", () => {
  assert.equal(inspect(page({ seconds: "", free: element("Free download") })).target, undefined);
});

test("publisher notice suggests trying the free download before start", () => {
  const state = inspect(page({
    seconds: "", timerHidden: true, free: element("Slow Speed Download"),
    notices: [element('The files of this publisher can be downloaded only by subscribers with solo subscription. Please Subscribe.')]
  }));
  assert.equal(state.stage, "notice");
  assert.equal(state.status, "Publisher subscription notice shown; try Slow Speed Download");
  assert.equal(state.target, undefined);
});

test("active countdown takes precedence over a publisher notice", () => {
  const state = inspect(page({ seconds: 173, notices: [element(
    "can be downloaded only by subscribers with solo subscription"
  )] }));
  assert.equal(state.stage, "timer");
  assert.equal(state.status, "Waiting: 173 seconds");
});

test("hidden restriction notices do not block normal countdowns", () => {
  const state = inspect(page({ seconds: 134, notices: [element(
    "can be downloaded only by subscribers with solo subscription", { hidden: true }
  )] }));
  assert.equal(state.stage, "timer");
});

test("hidden countdown before start shows the manual start instruction", () => {
  const state = inspect(page({ seconds: "", timerHidden: true, free: element("Slow Speed Download") }));
  assert.equal(state.status, "Click Slow Speed Download to start the countdown");
  assert.equal(state.target, undefined);
});

test("CAPTCHA Send waits for a nonempty response", () => {
  const submit = element("Send");
  assert.equal(inspect(page({ captcha: true, submit, tokens: [element()] })).target, undefined);
  assert.equal(inspect(page({ captcha: true, submit, tokens: [element("", { value: "  " })] })).target, undefined);
  assert.equal(inspect(page({ captcha: true, submit, tokens: [element("", { value: "completed-token" })] })).target, submit);
});

test("CAPTCHA Send respects disabled or hidden controls", () => {
  for (const options of [{ hidden: true }, { disabled: true }]) {
    assert.equal(inspect(page({ captcha: true, submit: element("Send", options), tokens: [element("", { value: "token" })] })).target, undefined);
  }
});

test("final download label is exact, case-insensitive, and whitespace normalized", () => {
  const download = element(" CLICK HERE\n TO DOWNLOAD ");
  assert.equal(inspect(page({ buttons: [element("HIGH SPEED DOWNLOAD"), element("Copy to My Files"), download] })).target, download);
  assert.equal(inspect(page({ buttons: [element("Advertisement: click here to download")] })).target, undefined);
  assert.equal(inspect(page({ buttons: [element("CLICK HERE TO DOWNLOAD", { hidden: true })] })).target, undefined);
});

test("final download works for input buttons", () => {
  const input = element("", { value: "Click here to download" });
  assert.equal(inspect(page({ buttons: [input] })).target, input);
});

test("content script clicks once per stage across polling and pause/resume", async () => {
  let checks;
  let settingsChanged;
  let clicks = 0;
  let state = { stage: "captcha", status: "ready", target: { click: () => clicks++ } };
  const context = {
    RapidgatorFlow: { inspect: () => state },
    document: { documentElement: {}, addEventListener() {} },
    window: { addEventListener() {} },
    MutationObserver: class { observe() {} },
    setTimeout() {},
    setInterval(callback) { checks = callback; },
    chrome: {
      runtime: { onMessage: { addListener() {} } },
      storage: {
        local: { get: async () => ({ enabled: true }) },
        onChanged: { addListener(callback) { settingsChanged = callback; } }
      }
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve("../content.js"), "utf8"), context);
  await Promise.resolve();
  assert.equal(clicks, 1);
  checks();
  checks();
  assert.equal(clicks, 1);
  settingsChanged({ enabled: { newValue: false } }, "local");
  settingsChanged({ enabled: { newValue: true } }, "local");
  assert.equal(clicks, 1);
  state = { stage: "download", status: "ready", target: { click: () => clicks++ } };
  checks();
  checks();
  assert.equal(clicks, 2);
});
