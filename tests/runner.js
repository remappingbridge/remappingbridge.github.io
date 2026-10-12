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

    check("API bootstrap exportado sem dependências", !!api && typeof api.boot === "function");
    if (api) {
      var info = api.getBootstrapInfo();
      check("Firmware fonte fixado na v3.2.3", info.version === "v3.2.3" &&
            info.commit === "f38c5fd15c68ea9a36d3b05912727788d7b98e81");
      check("Backend, framebuffer e BLE reais NÃO implementados", !info.framebufferImplemented &&
            !info.bluetoothImplemented && !info.uxImplemented);
      check("Brilho máximo contratado: 100%", info.maxWebBrightnessPercent === 100);
      check("9 linhas de prévia, todas até 21 colunas", api.isValidPreview(api.firstScreenTemplate) &&
            api.firstScreenTemplate.length === 9 &&
            api.firstScreenTemplate[0] === "SEARCHING FIRST MOUSE");
      check("Rejeita linhas maiores que 21 caracteres", !api.isValidPreview(["X".repeat(22)].concat(Array(8).fill(""))));
      check("Rejeita matriz com oito linhas", !api.isValidPreview(Array(8).fill("TEST")));
      check("Controles HAT válidos e valores incorretos rejeitados", api.controlLabel("JOY_PRESS") === "JOY PRESS" &&
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
      check("Bootstrap valida 9 HATs e marca estado ready", started === true &&
            root.getAttribute("data-boot-state") === "ready");

      buttons[0].click();
      check("JOY UP gera feedback sem navegar no firmware", counter.textContent === "01" &&
            feedback.textContent.indexOf("JOY UP") >= 0);

      buttons[8].click();
      check("KEY Y incrementa contador de demonstração", counter.textContent === "02" &&
            feedback.textContent.indexOf("KEY Y") >= 0);

      reset.click();
      check("Botão Limpar restaura estado e contador", counter.textContent === "00" &&
            feedback.textContent === "Pronto para receber comandos virtuais.");

      buttons[0].dispatchEvent(new Event("pointerdown"));
      check("Pressionar altera somente feedback visual", buttons[0].classList.contains("is-pressed"));
      buttons[0].dispatchEvent(new Event("pointerup"));
      check("Soltar remove estado visual", !buttons[0].classList.contains("is-pressed"));

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
    summary.textContent = passed + "/" + tests.length + " verificações passaram.";
    summary.className = passed === tests.length ? "pass" : "fail";
    window.__WEB01_TEST_RESULT__ = { passed: passed, total: tests.length };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}());
