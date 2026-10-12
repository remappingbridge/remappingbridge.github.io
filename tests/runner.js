/* WEB-01: browser-only smoke test. No node/npm, no network or build step. */
(function () {
  "use strict";
  function run() {
    var api = window.RemappingBridgeWeb;
    var results = document.getElementById("test-results");
    var summary = document.getElementById("summary");
    var tests = [];
    function check(name, condition) {
      tests.push({ name: name, pass: Boolean(condition) });
    }

    check("Bootstrap API exports without dependencies", !!api && typeof api.boot === "function");
    check("Test page declares English", document.documentElement.lang === "en");
    if (api) {
      var info = api.getBootstrapInfo();
      check("Firmware source pinned to v3.2.3", info.version === "v3.2.3" &&
            info.commit === "f38c5fd15c68ea9a36d3b05912727788d7b98e81");
      check("Real backend, framebuffer and BLE are NOT implemented", !info.framebufferImplemented &&
            !info.bluetoothImplemented && !info.uxImplemented);
      check("Maximum specified brightness: 100%", info.maxWebBrightnessPercent === 100);
      check("Nine preview rows, each at most 21 columns", api.isValidPreview(api.firstScreenTemplate) &&
            api.firstScreenTemplate.length === 9 &&
            api.firstScreenTemplate[0] === "SEARCHING FIRST MOUSE");
      check("Rejects rows longer than 21 characters", !api.isValidPreview(["X".repeat(22)].concat(Array(8).fill(""))));
      check("Rejects an eight-row matrix", !api.isValidPreview(Array(8).fill("TEST")));
      check("Valid HAT controls and rejection of unknown values", api.controlLabel("JOY_PRESS") === "JOY PRESS" &&
            api.controlLabel("KEY_Y") === "KEY Y" && api.controlLabel("KEY_Z") === null);

      // Minimal real DOM to exercise binding, 9 buttons, click and reset.
      var root = document.createElement("div");
      root.setAttribute("data-app-root", "");
      var feedback = document.createElement("p");
      feedback.setAttribute("data-feedback", "");
      var counter = document.createElement("output");
      counter.setAttribute("data-count", "");
      var reset = document.createElement("button");
      reset.setAttribute("data-reset", "");
      root.appendChild(feedback);
      root.appendChild(counter);
      root.appendChild(reset);
      var ids = ["JOY_UP","JOY_DOWN","JOY_LEFT","JOY_RIGHT","JOY_PRESS","KEY_A","KEY_B","KEY_X","KEY_Y"];
      var buttons = [];
      ids.forEach(function (id) {
        var button = document.createElement("button");
        button.setAttribute("data-control", id);
        root.appendChild(button);
        buttons.push(button);
      });
      document.body.appendChild(root);
      var started = api.boot(document);
      check("Bootstrap validates nine HAT controls and marks ready state", started === true &&
            root.getAttribute("data-boot-state") === "ready");

      buttons[0].click();
      check("Control feedback is in English", feedback.textContent.indexOf("demo input recorded.") >= 0);
      check("JOY UP produces feedback without firmware navigation", counter.textContent === "01" &&
            feedback.textContent.indexOf("JOY UP") >= 0);

      buttons[8].click();
      check("KEY Y increments the demonstration counter", counter.textContent === "02" &&
            feedback.textContent.indexOf("KEY Y") >= 0);

      reset.click();
      check("Clear button restores state and counter", counter.textContent === "00" &&
            feedback.textContent === "Ready for virtual controls.");
      check("Clear message is not Portuguese", !/pronto|comandos virtuais|limpar/i.test(feedback.textContent));

      buttons[0].dispatchEvent(new Event("pointerdown"));
      check("Press changes visual feedback only", buttons[0].classList.contains("is-pressed"));
      buttons[0].dispatchEvent(new Event("pointerup"));
      check("Release clears the visual pressed state", !buttons[0].classList.contains("is-pressed"));

      root.remove();
    }

    results.replaceChildren();
    tests.forEach(function (item) {
      var li = document.createElement("li");
      li.className = item.pass ? "pass" : "fail";
      li.textContent = (item.pass ? "PASS — " : "FAIL — ") + item.name;
      results.appendChild(li);
    });
    var passed = tests.filter(function (item) { return item.pass; }).length;
    summary.textContent = passed + "/" + tests.length + " checks passed.";
    summary.className = passed === tests.length ? "pass" : "fail";
    window.__WEB01_TEST_RESULT__ = { passed: passed, total: tests.length };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}());
