/* WEB-02 — browser-native Canvas/firmware font and HAT smoke tests.
 * No npm, bundler, third-party scripts, remote hardware or screenshot tools. */
(function () {
  "use strict";
  function run() {
    var api=window.RemappingBridgeWeb, lcd=window.RemappingBridgeLCD;
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

    if(lcd && api) {
      var info=api.getBootstrapInfo(), g=lcd.geometry, tone=lcd.tones, rows=api.firstScreenTemplate;
      check("Firmware v3.2.4 with unchanged v3.2.3 visual baseline",
            info.version==="v3.2.4" && info.uiBaseline==="v3.2.3");
      check("LCD bitmap implemented; real BLE/UX not yet implemented",
            info.framebufferImplemented && !info.bluetoothImplemented && !info.uxImplemented);
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
      check("Gentle 240x240 RGBA frame matches full visual golden",fnv32(gentle)==="a9662a35");
      check("Pressed KEY A state matches all-background golden fingerprints",
            fnv32(lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"original"))==="2e7041d5"&&
            fnv32(lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"soft"))==="942df955"&&
            fnv32(lcd.rasterize(lcd.previewFrame(rows,"KEY_A"),"gentle"))==="244450f5");
      check("Original firmware magenta is exact RGB565 (#080008)",
            same(pixel(original,0,0),[8,0,8,255]));
      check("Soft and Gentle adjust ONLY the web background",
            same(pixel(soft,0,0),[25,11,29,255])&&
            same(pixel(gentle,0,0),[40,20,44,255])&&
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
        b.setAttribute("aria-pressed",name==="soft"?"true":"false");root.appendChild(b);return b;
      });
      document.body.appendChild(root);
      var ctx=canvas.getContext("2d");
      check("Native Canvas 2D graphics available",!!ctx);
      if(ctx) {
        var started=api.boot(document);
        check("Application initializes 240x240 framebuffer",started===true&&
              root.getAttribute("data-lcd-renderer")==="canvas-240x240");
        check("Browser Canvas initially uses Soft magenta",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[25,11,29,255]));
        palettes[0].click();
        check("Original backdrop button changes Canvas without changing firmware text",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[8,0,8,255])&&
              palettes[0].getAttribute("aria-pressed")==="true");
        palettes[2].click();
        check("Gentle backdrop button changes only the LCD background",
              same(Array.from(ctx.getImageData(0,0,1,1).data),[40,20,44,255])&&
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
        check("HAT clicks remain demo-only: count and English feedback",
              counter.textContent==="02"&&feedback.textContent.indexOf("demo input recorded.")>=0);
        clear.click();
        check("Clear resets counter without navigating",
              counter.textContent==="00"&&feedback.textContent==="Ready for virtual controls.");
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
    window.__WEB02_TEST_RESULT__={passed:ok,total:tests.length};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();
}());
