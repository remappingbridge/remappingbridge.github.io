/* WEB-03 — browser-native font, color and HAT/Help/Lock regression tests.
 * No npm, bundler, third-party scripts, remote hardware or screenshot tools. */
(function () {
  "use strict";
  function run() {
    var api=window.RemappingBridgeWeb, lcd=window.RemappingBridgeLCD, hat=window.RemappingBridgeHAT;
    var results=document.getElementById("test-results"), summary=document.getElementById("summary");
    var tests=[];
    function check(name,ok){tests.push({name:name,pass:Boolean(ok)});}
    function pixel(rgba,x,y){
      var n=(y*240+x)*4;return Array.from(rgba.slice(n,n+4));
    }
    function same(a,b){return a.length===b.length && a.every(function(n,i){return n===b[i];});}
    function throws(fn){try{fn();return false;}catch(_){return true;}}
    function fnv32(bytes){
      var h=2166136261;
      for(var i=0;i<bytes.length;i++) h=Math.imul(h^bytes[i],16777619)>>>0;
      return h.toString(16).padStart(8,"0");
    }

    check("English document locale",document.documentElement.lang==="en");
    check("LCD Canvas renderer exported",!!lcd && typeof lcd.rasterize==="function");
    check("Application bootstrap exported",!!api && typeof api.boot==="function");
    check("HAT interaction engine exported",!!hat && typeof hat.createEngine==="function");

    if(lcd && api && hat) {
      var info=api.getBootstrapInfo(), g=lcd.geometry, tone=lcd.tones, rows=api.firstScreenTemplate;
      check("Firmware v3.2.4 with unchanged v3.2.3 visual baseline",
            info.version==="v3.2.4" && info.commit==="69a640d9767ec7198572eb9b5073ed71f8f3d202" &&
            info.uiBaseline==="v3.2.3" && info.uiBaselineCommit==="f38c5fd15c68ea9a36d3b05912727788d7b98e81");
      check("LCD and partial HAT implemented; full BLE/UX not yet implemented",
            info.framebufferImplemented && info.hatInteractionImplemented && !info.bluetoothImplemented && !info.uxImplemented);
      check("No browser brightness above 100 percent",info.maxWebBrightnessPercent===100);
      check("Canvas 240 by 240; grid 9 by 21",g.width===240&&g.height===240&&g.rows===9&&g.columns===21);
      check("Firmware glyph 5x7 scaled 2x and 11px spacing",
            g.glyphWidth===10&&g.glyphHeight===14&&g.glyphScale===2&&g.charAdvance===11);
      check("Renderer source blob pinned to v3.2.4",
            lcd.source.rendererBlob==="61c4fe3d547ba05c3e24de86518d807047b50a77");
      check("Original six RGB565 semantic colors",
            lcd.rgb565.MAGENTA===0xf81f&&lcd.rgb565.OFF_WHITE_YELLOW===0xffb8&&
            lcd.rgb565.LIGHT_GRAY===0xc618&&lcd.rgb565.WHITE===0xffff&&
            lcd.rgb565.CYAN===0x07ff&&lcd.rgb565.CYAN_FOCUSED===0xd7ff);
      check("RGB565 channels convert to correct RGB8",
            same(lcd.rgb565To888(0xf81f),[255,0,255])&&same(lcd.rgb565To888(0xffff),[255,255,255])&&
            same(lcd.rgb565To888(0x0801),[8,0,8]));
      check("Firmware A, Z, 0, 9 glyph bitmaps",
            lcd.glyphRow("A",0)===14&&lcd.glyphRow("Z",0)===31&&
            lcd.glyphRow("0",0)===14&&lcd.glyphRow("9",3)===15);
      check("MNT-13 pipe glyph fills vertical center column",
            Array.from({length:7},function(_,n){return lcd.glyphRow("|",n);}).every(function(x){return x===4;}));
      check("Punctuation plus, slash, backslash, arrows and blank supported",
            lcd.glyphRow("+",3)===31&&lcd.glyphRow("/",4)===16&&
            lcd.glyphRow("\\",0)===16&&lcd.glyphRow(">",0)===16&&lcd.glyphRow("@",0)===0);
      check("Source preview has exactly nine rows of up to 21 characters",
            api.isValidPreview(rows)&&rows.length===9&&rows[0]==="SEARCHING FIRST MOUSE");
      check("Rejects overlength and missing preview rows",
            !api.isValidPreview(["X".repeat(22)].concat(Array(8).fill("")))&&
            !api.isValidPreview(Array(8).fill("TEST")));
      check("All nine physical HAT control IDs accepted",
            ["JOY_UP","JOY_DOWN","JOY_LEFT","JOY_RIGHT","JOY_PRESS",
             "KEY_A","KEY_B","KEY_X","KEY_Y"].every(function(id){return !!api.controlLabel(id);}) &&
            api.controlLabel("KEY_Z")===null);

      var frame=lcd.previewFrame(rows),original=lcd.rasterize(frame,"original"),
          soft=lcd.rasterize(frame,"soft"),gentle=lcd.rasterize(frame,"gentle");
      check("Each LCD buffer is 240x240 RGBA with opaque pixels",
            original.length===240*240*4 && original[3]===255&&original[original.length-1]===255);
      check("Firmware didactic layout positions exact rows",
            same(Array.from({length:9},function(_,i){return lcd.textY(frame,i);}),
                [8,39,64,89,114,139,164,189,214]));
      check("Black and dark-magenta regions respect firmware separator",
            lcd.separatorY(frame)===240&&
            lcd.separatorY(lcd.newFrame(rows,{hintStartRow:6}))===151 &&
            same(pixel(lcd.rasterize(lcd.newFrame(Array(9).fill(""),{hintStartRow:6}),"soft"),0,0),[0,0,0,255])&&
            same(pixel(lcd.rasterize(lcd.newFrame(Array(9).fill(""),{hintStartRow:6}),"soft"),0,239),[25,11,29,255]));
      check("Original 240x240 RGBA frame matches full visual golden",fnv32(original)==="a8e6a495");
      check("Soft 240x240 RGBA frame matches full visual golden",fnv32(soft)==="913aca55");
      check("Gentle 240x240 RGBA frame matches full visual golden",fnv32(gentle)==="a19c1e15");
      check("Pressed KEY A state matches all-background golden fingerprints",
            fnv32(lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"original"))==="2e7041d5"&&
            fnv32(lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"soft"))==="942df955"&&
            fnv32(lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"gentle"))==="53515495");
      check("Original firmware magenta is exact RGB565 (#080008)",
            same(pixel(original,0,0),[8,0,8,255]));
      check("Soft and Gentle adjust ONLY the web background",
            same(pixel(soft,0,0),[25,11,29,255])&&
            same(pixel(gentle,0,0),[48,12,57,255])&&
            same(pixel(original,9,8),pixel(soft,9,8)));
      var white=lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"soft");
      check("Firmware press feedback whitens the exact KEY A label",
            frame.cells[7][1].tone===tone.ACTIONABLE&&
            lcd.previewFrame(rows,"KEY_A").cells[7][1].tone===tone.EMPHASIZED&&
            !same(pixel(soft,18,189),pixel(white,18,189)));
      check("Leading spaces preserved; LCD text physically clipped at 21",
            lcd.newFrame(["A".repeat(22)].concat(Array(8).fill(""))).cells[0].length===21 &&
            throws(function(){lcd.newFrame(Array(8).fill(""));}));
      check("Invalid tones and unknown magenta choices are rejected",
            throws(function(){lcd.setToneSpan(frame,0,0,1,99);})&&
            throws(function(){lcd.rasterize(frame,"ultra-bright");}));
      check("Background presets limited to Original, Soft and Gentle",
            same(Object.keys(lcd.backdrops).sort(),["gentle","original","soft"]));

      // Pure firmware-style HAT press/release state machine tests.
      var h=hat.createEngine(), ev;
      check("Default HAT screen is first-mouse tutorial",h.snapshot().screen===hat.screens.FIRST);
      h.press("KEY_Y");ev=h.release("KEY_Y");
      check("First-mouse tutorial cannot lock on KEY Y",ev.kind==="didactic"&&!h.snapshot().locked);
      h.setScenario("connected");
      h.press("JOY_UP");h.press("JOY_UP");
      check("Repeated keydown is ignored without duplicate actions",h.snapshot().held.length===1);
      h.release("JOY_UP");
      check("UP wraps connected HOME selection from 0 to 3",h.snapshot().selection===3);
      h.press("KEY_X");h.release("KEY_X");
      check("Help saves the previous HOME selection",h.snapshot().screen===hat.screens.HOME_HELP&&
            h.snapshot().returnSelection===3);
      h.press("JOY_DOWN");ev=h.release("JOY_DOWN");
      check("Help ignores navigation controls",ev.kind==="help-ignored"&&h.snapshot().screen===hat.screens.HOME_HELP);
      h.press("KEY_B");h.release("KEY_B");
      check("Help B restores selection and screen",h.snapshot().selection===3&&h.snapshot().screen===hat.screens.HOME);
      h.press("KEY_Y");
      check("Y locks only after release",!h.snapshot().locked);
      h.release("KEY_Y");
      check("Y release locks and consumes visible state",h.snapshot().locked);
      h.press("JOY_PRESS");ev=h.release("JOY_PRESS");
      check("Unlock release is consumed and resets to resolved HOME",ev.kind==="unlock"&&
            !h.snapshot().locked&&h.snapshot().screen===hat.screens.HOME&&h.snapshot().selection===0);
      h.press("JOY_DOWN");h.cancelAll();ev=h.release("JOY_DOWN");
      check("Lost keyup cancellation suppresses navigation",ev.kind==="ignored"&&h.snapshot().selection===0);
      h.setScenario("saved");h.press("KEY_B");h.release("KEY_B");
      check("Saved search B enters Retry",h.snapshot().screen===hat.screens.RETRY);
      h.press("KEY_A");h.release("KEY_A");
      check("Retry A returns to saved search",h.snapshot().screen===hat.screens.SEARCH);
      h.press("KEY_X");h.release("KEY_X");
      h.press("KEY_B");h.release("KEY_B");
      check("Searching Help B transitions to Retry",h.snapshot().screen===hat.screens.RETRY);
      h.press("KEY_Y");h.release("KEY_Y");
      ev=h.setScenario("connected");
      check("Scenario changes are disabled under Lock",ev.kind==="locked"&&h.snapshot().scenario==="saved");
      h.press("KEY_A");h.cancelAll();ev=h.release("KEY_A");
      check("Lost keyup never unlocks locked LCD",ev.kind==="ignored"&&h.snapshot().locked);
      h.press("KEY_A");ev=h.release("KEY_A");
      check("Valid release from Lock returns to saved search",ev.kind==="unlock"&&
            h.snapshot().screen===hat.screens.SEARCH);
      check("Keyboard controls include directional keys, Space and A/B/X/Y",
            api.keyControl("ArrowLeft")==="JOY_LEFT"&&api.keyControl(" ")==="JOY_PRESS"&&
            api.keyControl("Y")==="KEY_Y"&&api.keyControl("z")===null);
      check("Focused form inputs and buttons are protected from global shortcuts",
            api.isEditable({tagName:"INPUT"})&&api.isEditable({tagName:"BUTTON"})&&
            !api.isEditable({tagName:"DIV"}));
      check("All initial and supported Help templates have 9 English rows <=21",
            Object.keys(hat.templates).every(function(k){
              return api.isValidPreview(hat.templates[k]);
            }));

      // Real browser Canvas, created only in the test harness DOM.
      var root=document.createElement("div");root.setAttribute("data-app-root","");
      var feedback=document.createElement("p");feedback.setAttribute("data-feedback","");
      var counter=document.createElement("output");counter.setAttribute("data-count","");
      var clear=document.createElement("button");clear.setAttribute("data-reset","");
      var canvas=document.createElement("canvas");canvas.setAttribute("data-lcd-canvas","");
      canvas.width=240;canvas.height=240;
      root.appendChild(feedback);root.appendChild(counter);root.appendChild(clear);root.appendChild(canvas);
      var buttons=["JOY_UP","JOY_DOWN","JOY_LEFT","JOY_RIGHT","JOY_PRESS",
                   "KEY_A","KEY_B","KEY_X","KEY_Y"].map(function(id){
        var b=document.createElement("button");b.setAttribute("data-control",id);root.appendChild(b);return b;
      });
      var palettes=["original","soft","gentle"].map(function(name){
        var b=document.createElement("button");b.setAttribute("data-backdrop",name);
        b.setAttribute("aria-pressed",name==="gentle"?"true":"false");root.appendChild(b);return b;
      });
      var screenLabel=document.createElement("span");screenLabel.setAttribute("data-screen-label","");
      root.appendChild(screenLabel);
      var scenarioButtons=["first","connected","saved"].map(function(name){
        var b=document.createElement("button");b.setAttribute("data-scenario",name);
        b.setAttribute("aria-pressed",name==="first"?"true":"false");root.appendChild(b);return b;
      });
      document.body.appendChild(root);
      var ctx=canvas.getContext("2d");
      check("Native Canvas 2D graphics available",!!ctx);
      if(ctx) {
        var started=api.boot(document);
        check("Application initializes 240x240 framebuffer",started===true&&
              root.getAttribute("data-lcd-renderer")==="canvas-240x240");
        check("Browser Canvas defaults to the refined vivid Gentle magenta",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[48,12,57,255]));
        palettes[0].click();
        check("Original backdrop button changes Canvas without changing firmware text",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[8,0,8,255])&&
              palettes[0].getAttribute("aria-pressed")==="true");
        palettes[2].click();
        check("Gentle backdrop button changes only the LCD background",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[48,12,57,255])&&
              palettes[2].getAttribute("aria-pressed")==="true");
        palettes[1].click();
        buttons[5].dispatchEvent(new Event("pointerdown"));
        check("KEY A pointerdown highlights the exact LCD text",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[25,11,29,255])&&
              buttons[5].classList.contains("is-pressed"));
        buttons[5].dispatchEvent(new Event("pointerup"));
        check("KEY A pointer release clears pressed visual",
              !buttons[5].classList.contains("is-pressed"));
        buttons[0].click();buttons[8].click();
        check("First-mouse HAT inputs remain didactic, with English feedback",
              counter.textContent==="03"&&feedback.textContent.indexOf("tutorial input")>=0);
        clear.click();
        check("Clear resets counter without navigating",
              counter.textContent==="00"&&feedback.textContent==="Ready for virtual controls.");
        check("Default no-mouse screen remains canonical SEARCHING FIRST",
              api.getSession().screen===hat.screens.FIRST);
        scenarioButtons[1].click();
        check("Connected demo enters virtual HOME without real BLE",
              api.getSession().screen===hat.screens.HOME && screenLabel.textContent==="DEMO MOUSE");
        buttons[1].click(); // JOY DOWN
        check("Release-driven HOME option selection",
              api.getSession().selection===1);
        buttons[7].click(); // KEY X
        check("X opens matching connected HOME Help",
              api.getSession().screen===hat.screens.HOME_HELP);
        buttons[6].click(); // KEY B
        check("B exits Help and restores original selection",
              api.getSession().screen===hat.screens.HOME && api.getSession().selection===1);
        buttons[8].click(); // KEY Y
        check("Y locks HOME and blanks physical LCD",
              api.getSession().locked===true &&
              same(Array.from(ctx.getImageData(0,0,1,1).data),[0,0,0,255]));
        buttons[4].click(); // JOY PRESS unlock, consumed
        check("First press/release unlocks and cannot activate focused option",
              api.getSession().locked===false && api.getSession().screen===hat.screens.HOME &&
              api.getSession().selection===0);
        scenarioButtons[2].click();
        check("Saved-mouse demo starts HOME_SEARCHING",
              api.getSession().screen===hat.screens.SEARCH);
        buttons[7].click();
        check("Searching X opens canonical HOME SEARCHING HELP",
              api.getSession().screen===hat.screens.SEARCH_HELP);
        buttons[6].click();
        check("Searching Help B goes to Retry as firmware specifies",
              api.getSession().screen===hat.screens.RETRY);
        buttons[5].click(); // KEY A
        check("Retry A restarts the virtual saved search",
              api.getSession().screen===hat.screens.SEARCH);
        scenarioButtons[1].click();
        buttons[7].click(); // X enter HELP
        buttons[8].click(); // Y lock
        check("Y also locks while Help is shown",
              api.getSession().locked && screenLabel.textContent==="LCD LOCKED");
        buttons[6].click(); // B unlock, consumed, must not return Help
        check("Unlock from Help resolves HOME and consumes B",
              !api.getSession().locked && api.getSession().screen===hat.screens.HOME);
      }
      root.remove();
    }

    results.replaceChildren();
    tests.forEach(function(item){
      var li=document.createElement("li");li.className=item.pass?"pass":"fail";
      li.textContent=(item.pass?"PASS — ":"FAIL — ")+item.name;
      results.appendChild(li);
    });
    var ok=tests.filter(function(t){return t.pass;}).length;
    summary.textContent=ok+"/"+tests.length+" checks passed.";
    summary.className=ok===tests.length?"pass":"fail";
    window.__WEB03_TEST_RESULT__={passed:ok,total:tests.length};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
}());
