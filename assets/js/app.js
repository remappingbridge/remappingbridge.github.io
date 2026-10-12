/* WEB-01: no build tools, no external scripts and no hardware access.
 * This is a STATIC source-text preview, NOT the firmware renderer/UX model. */
(function () {
  "use strict";

  var FIRMWARE = Object.freeze({
    name: "RemappingBridge",
    version: "v3.2.3",
    commit: "f38c5fd15c68ea9a36d3b05912727788d7b98e81",
    gate: "WEB-01",
    lcdMode: "static text preview",
    framebufferImplemented: false,
    uxImplemented: false,
    bluetoothImplemented: false,
    maxWebBrightnessPercent: 100
  });

  var CONTROL_LABELS = Object.freeze({
    JOY_UP: "JOY UP",
    JOY_DOWN: "JOY DOWN",
    JOY_LEFT: "JOY LEFT",
    JOY_RIGHT: "JOY RIGHT",
    JOY_PRESS: "JOY PRESS",
    KEY_A: "KEY A",
    KEY_B: "KEY B",
    KEY_X: "KEY X",
    KEY_Y: "KEY Y"
  });

  var FIRST_SCREEN_TEMPLATE = Object.freeze([
    "SEARCHING FIRST MOUSE",
    "PRESS TO LEARN KEYS",
    "WHILE WAIT CONNECTION",
    "       JOY UP",
    "  JOY    JOY    JOY",
    "  LEFT  PRESS  RIGHT",
    "      JOY DOWN",
    " KEY A         KEY X",
    " KEY B         KEY Y"
  ]);

  function isValidPreview(rows) {
    return Array.isArray(rows) && rows.length === 9 && rows.every(function (row) {
      return typeof row === "string" && row.length <= 21;
    });
  }

  function getBootstrapInfo() {
    return FIRMWARE;
  }

  function controlLabel(value) {
    return Object.prototype.hasOwnProperty.call(CONTROL_LABELS, value)
      ? CONTROL_LABELS[value]
      : null;
  }

  function boot(doc) {
    var root = doc.querySelector("[data-app-root]");
    if (!root) return false;

    var feedback = root.querySelector("[data-feedback]");
    var countOutput = root.querySelector("[data-count]");
    var reset = root.querySelector("[data-reset]");
    var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-control]"));
    if (!feedback || !countOutput || !reset ||
        buttons.length !== 9 || !isValidPreview(FIRST_SCREEN_TEMPLATE)) {
      throw new Error("WEB-01: invalid HTML/bootstrap contract");
    }

    var seen = new Set();
    buttons.forEach(function (button) {
      var control = button.getAttribute("data-control");
      if (!controlLabel(control) || seen.has(control)) {
        throw new Error("WEB-01: duplicated/invalid HAT control: " + control);
      }
      seen.add(control);
    });

    var taps = 0;
    function announce(message) {
      feedback.textContent = message;
      countOutput.textContent = String(taps).padStart(2, "0");
    }
    function previewPress(button, state) {
      button.classList.toggle("is-pressed", state);
    }
    buttons.forEach(function (button) {
      button.addEventListener("pointerdown", function () { previewPress(button, true); });
      ["pointerup", "pointercancel", "pointerleave", "blur"].forEach(function (eventName) {
        button.addEventListener(eventName, function () { previewPress(button, false); });
      });
      button.addEventListener("click", function () {
        taps += 1;
        announce(controlLabel(button.getAttribute("data-control")) + " — entrada de demonstração registrada.");
      });
    });

    reset.addEventListener("click", function () {
      taps = 0;
      buttons.forEach(function (button) { previewPress(button, false); });
      announce("Pronto para receber comandos virtuais.");
    });

    root.setAttribute("data-boot-state", "ready");
    return true;
  }

  // A tiny hook for the future browser-only harness; not a backend/API.
  window.RemappingBridgeWeb = Object.freeze({
    getBootstrapInfo: getBootstrapInfo,
    controlLabel: controlLabel,
    isValidPreview: isValidPreview,
    firstScreenTemplate: FIRST_SCREEN_TEMPLATE,
    boot: boot
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { boot(document); }, { once: true });
  } else {
    boot(document);
  }
}());
