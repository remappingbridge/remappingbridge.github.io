/* WEB-04 — native browser regression harness: all 45 canonical templates,
 * per-pixel framebuffer, focus and navigation. No npm, CDN, server or BLE.
 */
(function(){
"use strict";
function run(){
 var W=window.RemappingBridgeWeb,L=window.RemappingBridgeLCD;
 var S=window.RemappingBridgeScreens,H=window.RemappingBridgeHAT;
 var P=window.RemappingBridgeProjector;
 var resultNode=document.getElementById("test-results"),summary=document.getElementById("summary");
 var tests=[];
 function check(name,pass){tests.push({name:name,pass:!!pass});}
 function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
 function pixel(data,x,y){var i=(y*240+x)*4;return Array.from(data.slice(i,i+4));}
 function hash(bytes){var h=2166136261;for(var i=0;i<bytes.length;i++)h=Math.imul(h^bytes[i],16777619)>>>0;return h.toString(16).padStart(8,"0");}
 function press(e,id){e.press(id);return e.release(id);}
 function throws(fn){try{fn();return false;}catch(_){return true;}}
 check("HTML document language is English",document.documentElement.lang==="en");
 check("Canvas, model, screen catalog and projector are exported",!!L&&!!H&&!!S&&!!P&&!!W);
 if(L&&H&&S&&P&&W){
  var info=W.getBootstrapInfo();
  check("Latest official v3.2.4 source and WEB-04",info.gate==="WEB-04"&&info.version==="v3.2.4"&&info.uiBaseline==="v3.2.3");
  check("Firmware renderer is 240x240 with 9x21 logical grid",L.geometry.width===240&&L.geometry.height===240&&L.geometry.rows===9&&L.geometry.columns===21);
  check("Physical C glyphs are 5x7 scaled twofold",L.geometry.glyphWidth===10&&L.geometry.glyphHeight===14&&L.glyphRow("A",0)===14);
  check("All six semantic RGB565 foreground colors retained",L.rgb565.MAGENTA===0xf81f&&L.rgb565.CYAN===0x07ff&&L.rgb565.CYAN_FOCUSED===0xd7ff&&L.rgb565.OFF_WHITE_YELLOW===0xffb8);
  check("MNT-13 vertical pipe bitmap unchanged",Array.from({length:7},function(_,n){return L.glyphRow("|",n);}).every(function(n){return n===4;}));
  check("Gentle magenta remains vivid #300c39",L.backdrops.gentle.hex==="#300c39");
  check("App does not provide brightness beyond 100% or real BLE",info.maxWebBrightnessPercent===100&&!info.bluetoothImplemented);
  check("Canonical catalog has exactly 45 unique screens",S.ids.length===45&&new Set(S.ids).size===45&&P.canonicalCount===45&&W.canonicalScreenCount===45);
  check("Catalog is pinned to original C Git blob",S.firmwareBlob==="132010179de09ea81f4543e9ca83def09c0a743f");
  check("All 45 screens contain exactly nine UTF-8 source strings",S.ids.every(function(id){return S.get(id).rows.length===9&&S.get(id).rows.every(function(x){return typeof x==="string";});}));
  check("Exactly two long C source rows in Remapping Help are retained",S.get("HELP_REMAPPER_OPTIONS").rows.filter(function(x){return x.length>21;}).length===2);
  check("Long firmware source strings clip to 21 LCD columns",P.frame({screen:"HELP_REMAPPER_OPTIONS",selection:0,held:[],savedCount:0,connected:false},L).cells[0].length===21);
  check("No retired Standard/Escape menu templates",S.ids.every(function(id){return !/STANDARD_REMAP|ESCAPE_REMAP|LEARN_THE_KEYS/.test(id);}));
  check("45 screen names map to HAT navigation templates",S.ids.every(function(id){return !!H.templates[id]&&H.templates[id]===S.get(id).rows;}));
  check("Source title is magenta",P.frame({screen:"HOME",selection:0,held:[],savedCount:1,connected:true,activeProfile:"PASSTHROUGH",movement:{horizontal:4,vertical:4,rotation:0}},L).cells[0][0].tone===L.tones.TITLE);
  // Golden WEB-02 and WEB-03 RGBA samples are intentionally retained.
  var rows=W.firstScreenTemplate,first=L.previewFrame(rows),orig=L.rasterize(first,"original"),gentle=L.rasterize(first,"gentle");
  check("Original magenta remains physical RGB565 #080008",same(pixel(orig,0,0),[8,0,8,255]));
  check("Gentle uses accepted web RGB #300c39",same(pixel(gentle,0,0),[48,12,57,255]));
  check("Title text RGB stays original #ff00ff",same(pixel(gentle,9,8),[255,0,255,255]));
  check("First-screen Gentle RGBA golden unchanged",hash(gentle)==="a19c1e15");
  check("KEY A pressed Gentle RGBA golden unchanged",hash(L.rasterize(L.previewFrame(rows,"KEY_A"),"gentle"))==="53515495");
  check("LCD outputs 230400 RGBA bytes",gentle.length===230400);
  check("Didactic text y positions unchanged",same(Array.from({length:9},function(_,i){return L.textY(first,i);}),[8,39,64,89,114,139,164,189,214]));
  // Test ALL templates as frames and raster images, never simply count names.
  var rendered=0,errors=[];
  S.ids.forEach(function(id){
   try{
    var e=H.createEngine();e.setScenario("connected");e.inspect(id);
    var frame=P.frame(e.snapshot(),L),bytes=L.rasterize(frame,"gentle");
    if(frame.cells.length!==9||frame.cells.some(function(row){return row.length!==21;})||bytes.length!==230400)throw Error("geometry");
    rendered++;
   }catch(err){errors.push(id+": "+err.message);}
  });
  check("Every one of 45 firmware screens rasterizes without overflow",rendered===45&&errors.length===0);
  var e=H.createEngine();
  check("Startup is didactic FIRST MOUSE",e.snapshot().screen==="SEARCHING_FIRST");
  press(e,"KEY_Y");
  check("First-mouse Y remains didactic without locking",!e.snapshot().locked);
  e.setScenario("connected");
  check("Connected demo starts HOME with four options",e.snapshot().screen==="HOME"&&e.optionCount()===4);
  press(e,"JOY_UP");
  check("HOME focus wraps 0 to 3",e.snapshot().selection===3);
  press(e,"JOY_DOWN");
  check("HOME focus wraps 3 to 0",e.snapshot().selection===0);
  var homeFrame=P.frame(e.snapshot(),L);
  check("HOME selected option shows a single first-column pipe",homeFrame.cells[1][0].character==="|"&&homeFrame.cells.slice(2,5).every(function(r){return r[0].character!=="|";}));
  press(e,"KEY_X");
  check("HOME X enters source REMOVE CONNECTED HELP",e.snapshot().screen==="HELP_HOME_CONNECTED");
  press(e,"JOY_DOWN");
  check("Help consumes unrelated HAT inputs",e.snapshot().screen==="HELP_HOME_CONNECTED");
  press(e,"KEY_B");
  check("Help B restores HOME focus",e.snapshot().screen==="HOME"&&e.snapshot().selection===0);
  e.press("KEY_Y");
  check("Lock waits for key release",e.snapshot().locked===false);
  e.release("KEY_Y");
  check("Y release locks LCD",e.snapshot().locked);
  var unlock=press(e,"JOY_PRESS");
  check("First release unlock is consumed and resolves HOME",unlock.kind==="unlock"&&!e.snapshot().locked&&e.snapshot().screen==="HOME");
  press(e,"JOY_PRESS");
  check("HOME first option navigates REMAPPING OPTIONS",e.snapshot().screen==="MOUSE_OPTIONS");
  check("Remapping options have exactly 3 choices",e.optionCount()===3);
  press(e,"JOY_DOWN");press(e,"JOY_DOWN");press(e,"JOY_PRESS");
  check("Modifier Shortcuts route reaches COMBINATIONS 1",e.snapshot().screen==="COMBINATIONS_1");
  var combo=P.frame(e.snapshot(),L);
  check("Two-line COMBINATIONS focus pipe belongs on status row 2",combo.cells[2][0].character==="|"&&combo.cells[1][0].character===" ");
  press(e,"JOY_RIGHT");
  check("Combinations pages advance via JOY RIGHT",e.snapshot().screen==="COMBINATIONS_2");
  press(e,"JOY_LEFT");
  check("Combinations pages retreat via JOY LEFT",e.snapshot().screen==="COMBINATIONS_1");
  press(e,"JOY_DOWN");combo=P.frame(e.snapshot(),L);
  check("Second combination selection marker appears on row 4, not row 3",combo.cells[4][0].character==="|"&&combo.cells[3][0].character===" ");
  press(e,"JOY_PRESS");
  check("Combination editor enters SHORTCUTS page",e.snapshot().screen==="SHORTCUTS_1");
  press(e,"JOY_LEFT");
  check("Shortcut pages wrap from 1 to 5",e.snapshot().screen==="SHORTCUTS_5");
  press(e,"JOY_RIGHT");
  check("Shortcut pages wrap from 5 to 1",e.snapshot().screen==="SHORTCUTS_1");
  var before=e.snapshot().shortcuts.join(",");
  var preview=press(e,"KEY_A");
  check("Shortcut apply is explicitly nonpersistent and stays in editor",preview.kind==="commit-pending"&&e.snapshot().shortcuts.join(",")===before&&e.snapshot().screen==="SHORTCUTS_1");
  press(e,"KEY_B");
  check("Shortcut B returns to focused combination page",e.snapshot().screen==="COMBINATIONS_1"&&e.snapshot().selection===1);
  press(e,"KEY_B");
  check("Combination B returns to Modifier Shortcuts focus",e.snapshot().screen==="MOUSE_OPTIONS"&&e.snapshot().selection===2);
  press(e,"JOY_UP");press(e,"JOY_PRESS");
  check("Custom Remapping route enters EDIT CUSTOM",e.snapshot().screen==="EDIT_CUSTOM");
  press(e,"JOY_PRESS");
  check("Custom target chooser opens LEFT WILL BECOME",e.snapshot().screen==="LEFT_WILL_BECOME");
  press(e,"KEY_B");
  check("Custom chooser B restores edited source",e.snapshot().screen==="EDIT_CUSTOM"&&e.snapshot().selection===0);
  press(e,"KEY_B");press(e,"KEY_B");
  check("Back returns from custom editor to HOME",e.snapshot().screen==="HOME");
  press(e,"JOY_DOWN");press(e,"JOY_PRESS");
  check("HOME Movement route enters MOVEMENT OPTIONS",e.snapshot().screen==="MOVEMENT_OPTIONS");
  press(e,"JOY_DOWN");press(e,"JOY_DOWN");
  var mv=P.frame(e.snapshot(),L);
  check("Rotation selected marker is on row 4, not blank row 3",mv.cells[4][0].character==="|"&&mv.cells[3][0].character!=="|");
  press(e,"JOY_PRESS");
  check("Movement rotation route opens ROTATION",e.snapshot().screen==="ROTATION");
  press(e,"KEY_X");
  check("Rotation X opens exact HELP ROTATION",e.snapshot().screen==="HELP_ROTATION");
  press(e,"KEY_B");
  check("Help B restores ROTATION selection",e.snapshot().screen==="ROTATION");
  press(e,"KEY_B");press(e,"KEY_B");
  check("Movement B returns to HOME",e.snapshot().screen==="HOME");
  press(e,"JOY_DOWN");press(e,"JOY_DOWN");press(e,"JOY_PRESS");
  check("Saved Devices route opens canonical screen",e.snapshot().screen==="SAVED_DEVICES");
  var saved=P.frame(e.snapshot(),L);
  check("Saved Devices has one implicit REMOVE DEVICE pipe",saved.cells[5][0].character==="|");
  press(e,"JOY_PRESS");
  check("Saved Devices enters REMOVE THIS MOUSE",e.snapshot().screen==="REMOVE_THIS");
  press(e,"KEY_X");
  check("REMOVE THIS X opens REMOVE MOUSE HELP",e.snapshot().screen==="HELP_REMOVE_THIS");
  press(e,"KEY_B");press(e,"KEY_B");
  check("Remove cancel returns to Saved Devices",e.snapshot().screen==="SAVED_DEVICES");
  press(e,"KEY_B");press(e,"JOY_DOWN");press(e,"JOY_DOWN");press(e,"JOY_DOWN");press(e,"JOY_PRESS");
  check("HOME Pair New enters pairing screen",e.snapshot().screen==="PAIR_MOUSE");
  press(e,"KEY_X");
  check("Pair New X opens pair Help",e.snapshot().screen==="HELP_PAIR_NEW");
  press(e,"KEY_B");
  check("Pair Help B transitions to Retry Pair New",e.snapshot().screen==="RETRY_PAIR_NEW");
  press(e,"KEY_A");
  check("Retry Pair New A returns to PAIR_MOUSE",e.snapshot().screen==="PAIR_MOUSE");
  e.setScenario("saved");press(e,"KEY_X");press(e,"KEY_B");
  check("Searching Help B transitions to HOME RETRY",e.snapshot().screen==="HOME_RETRY");
  press(e,"KEY_A");
  check("HOME RETRY A restarts saved search",e.snapshot().screen==="HOME_SEARCHING");
  e.inspect("MOUSE_SAVED");
  check("Inspector makes FIRST MOUSE CONNECTED available",e.snapshot().screen==="MOUSE_SAVED");
  check("Inspector rejects nonexistent screen",throws(function(){e.inspect("NOT_A_SCREEN");}));
  e.inspect("COMBINATIONS_6");
  check("All six combination pages selectable via inspector",e.snapshot().screen==="COMBINATIONS_6");
  e.inspect("SHORTCUTS_5");
  check("All five shortcuts pages selectable via inspector",e.snapshot().screen==="SHORTCUTS_5");
  e.press("JOY_UP");e.cancelAll();
  check("Lost keyup cancellation clears held keys",e.snapshot().held.length===0);
  check("Keyboard arrows/Enter/Space and A/B/X/Y mappings retained",W.keyControl("ArrowDown")==="JOY_DOWN"&&W.keyControl(" ")==="JOY_PRESS"&&W.keyControl("x")==="KEY_X");
  check("Keyboard text fields remain protected",W.isEditable({tagName:"INPUT"})&&W.isEditable({tagName:"SELECT"})&&W.isEditable({tagName:"BUTTON"}));
  // Real Canvas2D DOM integration tests run on the browser, not just pure data.
  var root=document.createElement("div");root.setAttribute("data-app-root","");
  var feedback=document.createElement("p");feedback.setAttribute("data-feedback","");
  var counter=document.createElement("output");counter.setAttribute("data-count","");
  var reset=document.createElement("button");reset.setAttribute("data-reset","");
  var canvas=document.createElement("canvas");canvas.setAttribute("data-lcd-canvas","");
  var title=document.createElement("span");title.setAttribute("data-screen-label","");
  var inspect=document.createElement("select");inspect.setAttribute("data-screen-inspector","");
  canvas.width=240;canvas.height=240;
  [feedback,counter,reset,canvas,title,inspect].forEach(function(el){root.appendChild(el);});
  var keys=["JOY_UP","JOY_LEFT","JOY_PRESS","JOY_RIGHT","JOY_DOWN","KEY_A","KEY_B","KEY_X","KEY_Y"].map(function(id){
   var btn=document.createElement("button");btn.setAttribute("data-control",id);root.appendChild(btn);return btn;
  });
  var scenarios=["first","connected","saved"].map(function(id){
   var b=document.createElement("button");b.setAttribute("data-scenario",id);root.appendChild(b);return b;
  });
  document.body.appendChild(root);
  var ctx=canvas.getContext("2d");
  check("Native browser Canvas 2D is available",!!ctx);
  if(ctx){
   var started=W.boot(document);
   check("Application boots with no backdrop option buttons",started===true&&root.querySelectorAll("[data-backdrop]").length===0);
   check("Inspector contains all 45 original screens",inspect.children.length===45);
   check("Fixed Gentle LCD is used on initial screen",same(Array.from(ctx.getImageData(0,0,1,1).data),[48,12,57,255]));
   scenarios[1].click();
   check("Connected demo selector starts HOME",W.getSession().screen==="HOME");
   keys[1].click(); // JOY LEFT inert on HOME
   keys[4].click(); // JOY DOWN changes focus
   check("A HAT click changes HOME focus",W.getSession().selection===1);
   keys[7].click(); // X -> Help
   check("X on virtual HAT opens HOME help in Canvas",W.getSession().screen==="HELP_HOME_CONNECTED");
   keys[6].click(); // B -> Home
   check("B on virtual HAT returns to HOME",W.getSession().screen==="HOME");
   inspect.value="SHORTCUTS_4";
   inspect.dispatchEvent(new Event("change"));
   check("QA screen selector displays requested canonical template",W.getSession().screen==="SHORTCUTS_4");
   keys[8].click();
   check("Y locks the LCD and makes Canvas black",W.getSession().locked&&same(Array.from(ctx.getImageData(0,0,1,1).data),[0,0,0,255]));
   keys[5].click();
   check("An unlock action is consumed and returns HOME",!W.getSession().locked&&W.getSession().screen==="HOME");
   reset.click();
   check("Clear resets only counters and pressed state",counter.textContent==="00"&&feedback.textContent==="Ready for virtual controls.");
  }
  root.remove();
 }
 resultNode.replaceChildren();
 tests.forEach(function(item){var li=document.createElement("li");li.className=item.pass?"pass":"fail";li.textContent=(item.pass?"PASS — ":"FAIL — ")+item.name;resultNode.appendChild(li);});
 var ok=tests.filter(function(t){return t.pass;}).length;
 summary.textContent=ok+"/"+tests.length+" checks passed.";
 summary.className=ok===tests.length?"pass":"fail";
 window.__WEB04_TEST_RESULT__={passed:ok,total:tests.length};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
else run();
}());
