/* WEB-09 — native browser tests for deterministic isolated diagnostics and prior firmware gates,
 * per-pixel framebuffer, focus and navigation. No npm, CDN, server or BLE.
 */
(function(){
"use strict";
function run(){
 var W=window.RemappingBridgeWeb,L=window.RemappingBridgeLCD;
 var S=window.RemappingBridgeScreens,H=window.RemappingBridgeHAT;
 var P=window.RemappingBridgeProjector,V=window.RemappingBridgeVirtualMice,D=window.RemappingBridgeDiagnostics;
 var resultNode=document.getElementById("test-results"),summary=document.getElementById("summary");
 var tests=[];
 function check(name,pass){tests.push({name:name,pass:!!pass});}
 function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
 function pixel(data,x,y){var i=(y*240+x)*4;return Array.from(data.slice(i,i+4));}
 function hash(bytes){var h=2166136261;for(var i=0;i<bytes.length;i++)h=Math.imul(h^bytes[i],16777619)>>>0;return h.toString(16).padStart(8,"0");}
 function press(e,id){e.press(id);return e.release(id);}
 function throws(fn){try{fn();return false;}catch(_){return true;}}
 check("HTML document language is English",document.documentElement.lang==="en");
 check("Canvas, model, 45 screens, projector and local mouse module exported",!!L&&!!H&&!!S&&!!P&&!!W&&!!V&&!!D);
 if(L&&H&&S&&P&&W&&V&&D){
  var info=W.getBootstrapInfo();
  check("Latest official v3.2.4 source and WEB-09",info.gate==="WEB-09"&&info.version==="v3.2.4"&&info.uiBaseline==="v3.2.3");
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
  check("Shortcut A proposes commit without mutating stored assignments",preview.kind==="set-shortcut"&&preview.payload.combination===1&&preview.payload.shortcut===1&&e.snapshot().shortcuts.join(",")===before&&e.snapshot().screen==="SHORTCUTS_1");
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
  // WEB-05 model: observable deterministic scheduling with no real BLE.
  function memoryStore(){
    var records={};
    return {getItem:function(k){return Object.prototype.hasOwnProperty.call(records,k)?records[k]:null;},
      setItem:function(k,v){records[k]=String(v);},removeItem:function(k){delete records[k];}};
  }
  var store=memoryStore(),virtual=V.create({storage:store});
  check("Schema and eight-slot maximum are explicit",V.schema==="remappingbridge-virtual-mice-v1"&&V.maxMice===8&&virtual.snapshot().mice.length===0);
  check("Virtual store starts as durable empty storage",virtual.snapshot().durable&&!virtual.snapshot().recovered);
  var started=virtual.beginPair("  Office   Mouse  ");
  check("Pair New starts a logical attempt with normalized name",started.kind==="started"&&virtual.snapshot().pending.name==="Office Mouse");
  var token=virtual.snapshot().pending.token;
  virtual.advance(3);
  check("Manual deterministic clock advances without background timers",virtual.snapshot().clock===3&&virtual.snapshot().pending.token===token);
  virtual.complete(true,token);
  check("Successful virtual pairing creates one bond and connects it",
    virtual.snapshot().mice.length===1&&virtual.snapshot().connectedId===virtual.snapshot().mice[0].id);
  check("Bond has isolated default profile and movement settings",
    virtual.snapshot().mice[0].profile.kind==="PASSTHROUGH"&&
    same(virtual.snapshot().mice[0].profile.targets,[0,1,2,3,4])&&
    virtual.snapshot().mice[0].profile.shortcuts.length===12);
  virtual.beginPair("office mouse");
  check("Pairing same name never creates duplicate virtual device",
    virtual.snapshot().mice.length===1&&virtual.snapshot().pending===null);
  var reloaded=V.create({storage:store});
  check("Reload validates and restores bond, name, profile and sequence",
    reloaded.snapshot().recovered&&reloaded.snapshot().mice[0].name==="Office Mouse"&&reloaded.snapshot().seq===1);
  check("Reload restores no pending virtual pairing",reloaded.snapshot().pending===null);
  virtual.disconnect();
  check("Disconnect keeps saved bond but clears active mouse",virtual.snapshot().mice.length===1&&virtual.snapshot().connectedId===null);
  virtual.beginSearch();
  var stale=virtual.snapshot().pending.token;
  virtual.cancel("test");
  virtual.complete(true,stale);
  check("Canceled pairing result is rejected and cannot reconnect",
    virtual.snapshot().connectedId===null&&virtual.snapshot().mice.length===1);
  virtual.beginSearch();
  var old=virtual.snapshot().pending.token;
  virtual.beginSearch();
  virtual.complete(true,old);
  check("Superseded pairing result does not complete a newer attempt",
    virtual.snapshot().pending!==null&&virtual.snapshot().connectedId===null);
  virtual.complete(true);
  check("Saved-mouse search reconnects only the chosen existing bond",
    virtual.snapshot().mice.length===1&&virtual.snapshot().connectedId===virtual.snapshot().frontId);
  virtual.disconnect();
  virtual.beginSearch();
  virtual.advance(5);
  check("Five logical ticks cause timeout without auto-connect",
    virtual.snapshot().pending===null&&virtual.snapshot().connectedId===null&&
    virtual.snapshot().events[0].kind==="timeout");
  virtual.beginSearch();
  virtual.complete(false);
  check("Simulated failure preserves all saved bonds",virtual.snapshot().mice.length===1&&virtual.snapshot().connectedId===null);
  for(var m=2;m<=8;m++){virtual.beginPair("Mouse "+m);virtual.complete(true);}
  check("Exactly eight different virtual mouse profiles can be saved",virtual.snapshot().mice.length===8);
  var filled=virtual.beginPair("Overflow Mouse");
  check("Ninth pair rejected without exceeding capacity",filled.kind==="full"&&virtual.snapshot().mice.length===8);
  var selected=virtual.snapshot().mice[3].id;
  virtual.selectFront(selected);
  check("Front bond selection persists independently of active mouse",
    virtual.snapshot().frontId===selected&&virtual.snapshot().connectedId!==selected);
  virtual.beginSearch(selected);virtual.complete(true);
  check("Search and reconnect switch connected mouse without duplicated bonds",
    virtual.snapshot().connectedId===selected&&virtual.snapshot().mice.length===8);
  var savedBefore=virtual.snapshot().mice.length;
  virtual.remove(selected);
  check("Removing active mouse clears its connected bond and complete profile",
    virtual.snapshot().connectedId===null&&virtual.snapshot().mice.length===savedBefore-1&&
    !virtual.snapshot().mice.some(function(x){return x.id===selected;}));
  var removeOther=virtual.snapshot().mice[0].id;
  virtual.remove(removeOther);
  check("Removing offline mouse preserves disconnected state",virtual.snapshot().mice.length===6&&!virtual.snapshot().connectedId);
  virtual.reboot();
  check("Virtual reboot retains bonds while clearing active connection",
    virtual.snapshot().mice.length===6&&virtual.snapshot().connectedId===null);
  check("History is local, bounded and stamped by logical clock",
    virtual.snapshot().events.length<=48&&virtual.snapshot().events.every(function(x){return x.at<=virtual.snapshot().clock;}));
  var restore=V.create({storage:store});
  check("Reload after removal preserves the final six distinct bonds",
    restore.snapshot().mice.length===6&&new Set(restore.snapshot().mice.map(function(x){return x.id;})).size===6);
  virtual.reset();
  check("Reset deletes all saved bonds, pairing, connection and front mouse",
    virtual.snapshot().mice.length===0&&virtual.snapshot().frontId===null&&
    virtual.snapshot().connectedId===null&&virtual.snapshot().pending===null);
  var emptyReload=V.create({storage:store});
  check("Reload after reset is empty without ghost bonds",emptyReload.snapshot().mice.length===0);
  check("Invalid serialized state is rejected before use",
    throws(function(){V.validate({schema:V.schema,seq:0,clock:0,mice:[{id:"bad"}],frontId:null,connectedId:null,events:[]});}));
  var brokenStore={getItem:function(){return "{corrupt";},setItem:function(){throw Error("blocked");},removeItem:function(){throw Error("blocked");}};
  var broken=V.create({storage:brokenStore});
  check("Corrupt or disabled local storage degrades safely to memory only",
    !broken.snapshot().durable&&broken.snapshot().mice.length===0);
  broken.beginPair("Offline Only");broken.complete(true);
  check("Memory-only mode allows testing without claiming durable storage",
    broken.snapshot().mice.length===1&&!broken.snapshot().durable);
  var mouseEvents=[],tracked=V.create({storage:memoryStore()});
  var unsubscribe=tracked.subscribe(function(ev){mouseEvents.push(ev.kind);});
  tracked.beginPair("Tracking");tracked.complete(true);unsubscribe();tracked.disconnect();
  check("Virtual events expose observable transitions and allow unsubscribing",
    same(mouseEvents,["started","paired"]));
  var eng=H.createEngine();eng.syncMice(restore.snapshot(),"initialized");
  check("Persisted disconnected bonds select HOME SEARCHING on load",
    eng.snapshot().screen==="HOME_SEARCHING"&&eng.snapshot().savedCount===6);
  eng.syncMice(restore.snapshot(),"started-saved");
  check("Saved-mouse simulation enters the searching screen",eng.snapshot().screen==="HOME_SEARCHING");
  eng.syncMice(restore.snapshot(),"timeout-saved");
  check("Saved search timeout opens canonical HOME RETRY",eng.snapshot().screen==="HOME_RETRY");
  eng.syncMice(restore.snapshot(),"started-pair");
  check("Pair New simulation opens canonical PAIR NEW",eng.snapshot().screen==="PAIR_MOUSE");
  eng.syncMice(restore.snapshot(),"failed-pair");
  check("Pair failure opens canonical RETRY PAIR NEW",eng.snapshot().screen==="RETRY_PAIR_NEW");
  var withRemoved=restore.snapshot();eng.syncMice(withRemoved,"initialized");
  eng.inspect("SAVED_DEVICES");
  check("Saved Devices selection renders the restored front mouse name",
    P.frame(eng.snapshot(),L).cells[1].map(function(x){return x.character;}).join("").indexOf(withRemoved.mice[0].name.toUpperCase())>=0);
  // WEB-06: Custom/MODIFIER and Movement states persist per virtual bond.
  var ps=memoryStore(),profiles=V.create({storage:ps});
  profiles.beginPair("Mouse Alpha");profiles.complete(true);
  var alpha=profiles.snapshot().connectedId;
  profiles.beginPair("Mouse Beta");profiles.complete(true);
  var beta=profiles.snapshot().connectedId;
  check("New virtual mice start with isolated PASSTHROUGH profiles",
    profiles.profileFor(alpha).kind==="PASSTHROUGH"&&profiles.profileFor(beta).kind==="PASSTHROUGH");
  var originalB=profiles.profileFor(beta);
  var alphaProfile=profiles.profileFor(alpha);
  alphaProfile.kind="CUSTOM";alphaProfile.targets=[5,1,2,3,4];
  alphaProfile.movement={horizontal:8,vertical:3,rotation:1};
  var alphaEvent=profiles.applyProfile(alpha,alphaProfile);
  check("Custom and Movement values atomically apply only to Mouse Alpha",
    alphaEvent.kind==="profile-applied"&&profiles.profileFor(alpha).targets[0]===5&&
    profiles.profileFor(alpha).movement.horizontal===8&&profiles.profileFor(beta).kind==="PASSTHROUGH");
  var invalid=profiles.profileFor(alpha);
  invalid.targets=[5,5,2,3,4];
  check("Two simultaneously assigned Modifier targets are rejected",
    throws(function(){profiles.applyProfile(alpha,invalid);})&&
    same(profiles.profileFor(alpha).targets,[5,1,2,3,4]));
  var invalidGain=profiles.profileFor(beta);
  invalidGain.movement.horizontal=7;
  check("Invalid DPI gain outside 0.25x..3x source scale is rejected",
    throws(function(){profiles.applyProfile(beta,invalidGain);}));
  var betaProfile=profiles.profileFor(beta);
  betaProfile.kind="CUSTOM";betaProfile.targets=[0,1,2,5,4];
  betaProfile.movement={horizontal:2,vertical:12,rotation:3};
  profiles.applyProfile(beta,betaProfile);
  check("Distinct saved Mouse Beta supports Forward Modifier and 270 degree rotation",
    profiles.profileFor(beta).targets[3]===5&&profiles.profileFor(beta).movement.rotation===3);
  var ed=H.createEngine();
  ed.syncMice(profiles.snapshot(),"initialized");
  check("Connecting Beta rehydrates its own applied profile and movement",
    ed.snapshot().activeProfile==="CUSTOM"&&ed.snapshot().movement.horizontal===2&&
    ed.snapshot().movement.vertical===12&&ed.snapshot().customTargets[3]===5);
  ed.inspect("EDIT_CUSTOM");
  press(ed,"JOY_PRESS");
  check("LEFT target chooser defaults to currently applied LEFT setting",
    ed.snapshot().screen==="LEFT_WILL_BECOME"&&ed.snapshot().selection===0);
  for(var ix=0;ix<5;ix++)press(ed,"JOY_DOWN");
  press(ed,"KEY_A");
  check("New Modifier draft displaces Forward modifier to Forward identity",
    ed.snapshot().screen==="EDIT_CUSTOM"&&
    same(ed.snapshot().customTargets,[5,1,2,3,4])&&ed.snapshot().customDirty);
  var appliedMenu=P.frame(Object.assign({},ed.snapshot(),{screen:"MOUSE_OPTIONS",selection:2}),L);
  check("MNT-12 modifier row stays applied cyan while unrelated draft is pending",
    appliedMenu.cells[3][1].tone===L.tones.SELECTED_CURRENT&&ed.snapshot().customDirty);
  check("Applied modifiers remain unchanged until Custom APPLY",
    same(ed.snapshot().appliedTargets,[0,1,2,5,4])&&ed.snapshot().activeProfile==="CUSTOM"&&
    profiles.profileFor(beta).targets[3]===5);
  ed.inspect("LEFT_WILL_BECOME");
  var canceled=H.createEngine();
  canceled.syncMice(profiles.snapshot(),"initialized");
  canceled.inspect("EDIT_CUSTOM");
  press(canceled,"JOY_PRESS");
  for(var k=0;k<5;k++)press(canceled,"JOY_DOWN");
  press(canceled,"KEY_A");
  press(canceled,"KEY_B");
  check("B exits EDIT CUSTOM and cancels unapplied target draft",
    canceled.snapshot().screen==="MOUSE_OPTIONS"&&!canceled.snapshot().customDirty&&
    same(canceled.snapshot().customTargets,canceled.snapshot().appliedTargets));
  var willFrame=P.frame(ed.snapshot(),L);
  check("Draft modifier does not turn uncommitted candidate cyan",
    willFrame.cells[6][1].tone!==L.tones.CURRENT&&willFrame.cells[6][1].tone!==L.tones.SELECTED_CURRENT&&willFrame.cells[1][1].tone===L.tones.SELECTED_CURRENT);
  ed.inspect("EDIT_CUSTOM");
  var applyCustom=press(ed,"KEY_A");
  check("Edit Custom A emits an explicit commit request with draft target data",
    applyCustom.kind==="apply-custom"&&same(applyCustom.payload.targets,[5,1,2,3,4]));
  betaProfile=profiles.profileFor(beta);betaProfile.targets=applyCustom.payload.targets;
  profiles.applyProfile(beta,betaProfile);ed.syncMice(profiles.snapshot(),"profile-applied");ed.confirmApply("custom");
  check("Custom APPLY persists new modifier, clears dirty state and returns to Remapping Options",
    profiles.profileFor(beta).targets[0]===5&&!ed.snapshot().customDirty&&
    ed.snapshot().screen==="MOUSE_OPTIONS"&&ed.snapshot().selection===1);
  ed.inspect("MOVEMENT_OPTIONS");
  var toVertical=press(ed,"JOY_DOWN");
  press(ed,"JOY_PRESS");
  check("Vertical DPI opens FAST page for applied 3x gain",
    ed.snapshot().screen==="VERTICAL_FAST_DPI"&&ed.snapshot().selection===3);
  var page=press(ed,"JOY_LEFT");
  check("DPI left/right switches between FAST and SLOW groups",page.kind==="page"&&ed.snapshot().screen==="VERTICAL_SLOW_DPI");
  ed.inspect("ROTATION");
  ed.press("JOY_DOWN");ed.release("JOY_DOWN");
  var rotationCmd=press(ed,"KEY_A");
  check("Rotation A emits 90-degree delta without mutating stored state",
    rotationCmd.kind==="apply-movement"&&rotationCmd.payload.movement.rotation===1&&
    profiles.profileFor(beta).movement.rotation===3);
  betaProfile=profiles.profileFor(beta);betaProfile.movement=rotationCmd.payload.movement;
  profiles.applyProfile(beta,betaProfile);ed.syncMice(profiles.snapshot(),"profile-applied");ed.confirmApply("movement");
  check("Movement Apply updates only selected mouse and returns to Movement Options",
    ed.snapshot().screen==="MOVEMENT_OPTIONS"&&profiles.profileFor(beta).movement.rotation===1&&
    profiles.profileFor(alpha).movement.rotation===1);
  var resetCmd=press(ed,"KEY_A");
  check("Movement Reset All requests neutral H/V and zero rotation",
    resetCmd.kind==="reset-movement"&&same(resetCmd.payload.movement,{horizontal:4,vertical:4,rotation:0}));
  profiles.resetMovement(beta);ed.syncMice(profiles.snapshot(),"profile-applied");ed.confirmApply("movement");
  check("Reset Movement preserves Custom mapping and Alpha's independent gains",
    same(profiles.profileFor(beta).targets,[5,1,2,3,4])&&profiles.profileFor(beta).kind==="CUSTOM"&&
    same(profiles.profileFor(beta).movement,{horizontal:4,vertical:4,rotation:0})&&
    profiles.profileFor(alpha).movement.horizontal===8);
  var refreshed=V.create({storage:ps});
  check("Reload preserves both independent mouse profiles and custom targets",
    refreshed.profileFor(alpha).movement.horizontal===8&&
    refreshed.profileFor(beta).movement.horizontal===4&&
    same(refreshed.profileFor(beta).targets,[5,1,2,3,4]));
  refreshed.beginSearch(alpha);refreshed.complete(true);
  var alphaEngine=H.createEngine();alphaEngine.syncMice(refreshed.snapshot(),"connected");
  check("Reconnect Alpha restores its own horizontal 2x and vertical 0.75x",
    alphaEngine.snapshot().movement.horizontal===8&&alphaEngine.snapshot().movement.vertical===3&&
    alphaEngine.snapshot().customTargets[0]===5);
  var mode=refreshed.profileFor(alpha);mode.kind="PASSTHROUGH";
  refreshed.applyProfile(alpha,mode);
  check("Applying PASSTHROUGH changes active profile but retains per-mouse draft targets",
    refreshed.profileFor(alpha).kind==="PASSTHROUGH"&&refreshed.profileFor(alpha).targets[0]===5);
  refreshed.remove(beta);
  check("Deleting Beta removes its independent profile without touching Alpha",
    !refreshed.profileFor(beta)&&refreshed.profileFor(alpha).targets[0]===5);

  // WEB-07: all C combination ordinals, 30 native shortcut identities,
  // MNT-12 applied/draft predicates and MNT-13 second-row markers.
  check("All 12 canonical combination ordinals in v3.2.4 source order",
    H.combinationNames.length===12&&H.combinationNames[0]==="MODIFIER RELEASED"&&
    H.combinationNames[1]==="MOD + MIDDLE"&&H.combinationNames[5]==="MOD + BACKWARD"&&
    H.combinationNames[11]==="MOD + MOVE DOWN");
  check("Exact 30 source-defined shortcut names with reserved zero",
    H.shortcutNames.length===31&&H.shortcutNames[0]==="NOT CUSTOMIZED"&&
    H.shortcutNames[1]==="COPY"&&H.shortcutNames[25]==="HOME SCREEN/PAGE"&&
    H.shortcutNames[30]==="BRIGHTNESS DOWN");
  check("Every canonical shortcut source page maps to six option IDs",
    Array.from({length:30},function(_,i){
      var id=i+1,page=1+Math.floor(i/6),row=i%6+1;
      return S.get("SHORTCUTS_"+page).rows[row].trim()===H.shortcutNames[id];
    }).every(Boolean));
  var combStore=memoryStore(),combVirtual=V.create({storage:combStore});
  combVirtual.beginPair("Combo One");combVirtual.complete(true);
  var comboId=combVirtual.snapshot().connectedId;
  var cp=combVirtual.profileFor(comboId);
  cp.kind="CUSTOM";cp.targets=[0,1,5,3,4]; // MIDDLE is Modifier
  cp.shortcuts[0]=25;cp.shortcuts[1]=5;
  combVirtual.applyProfile(comboId,cp);
  var ce=H.createEngine();ce.syncMice(combVirtual.snapshot(),"initialized");
  check("Modifier Shortcuts active only for applied Custom + Modifier",
    ce.snapshot().modifierShortcutsActive&&ce.snapshot().modifierSource===2&&
    H.shortcutsActive("CUSTOM",cp.targets)&&!H.shortcutsActive("PASSTHROUGH",cp.targets)&&
    !H.shortcutsActive("CUSTOM",[0,1,2,3,4]));
  check("Exactly owning MIDDLE combination is unavailable",
    Array.from({length:12},function(_,i){return H.comboUnavailable(i,cp.targets);})
      .filter(Boolean).length===1&&H.comboUnavailable(1,cp.targets));
  var unavailSources=[[5,1,2,3,4],2,[0,5,2,3,4],3,[0,1,2,5,4],4,[0,1,2,3,5],5];
  check("Unavailable source mapping covers Left, Right, Forward and Backward",
    H.comboUnavailable(2,[5,1,2,3,4])&&H.comboUnavailable(3,[0,5,2,3,4])&&
    H.comboUnavailable(4,[0,1,2,5,4])&&H.comboUnavailable(5,[0,1,2,3,5]));
  ce.inspect("MOUSE_OPTIONS");
  var activeMenu=P.frame(ce.snapshot(),L);
  check("MNT-12 applied Custom profile presents Modifier Shortcuts in cyan",
    activeMenu.cells[3][1].tone===L.tones.CURRENT);
  ce.inspect("COMBINATIONS_1");
  var activeFrame=P.frame(ce.snapshot(),L);
  check("MNT-12 assigned available COMBINATIONS value is focused cyan",
    activeFrame.cells[2][1].tone===L.tones.SELECTED_CURRENT&&
    activeFrame.cells[2][0].character==="|");
  check("MNT-12 UNAVAILABLE cell retains static yellow and exact source word",
    activeFrame.cells[4].map(function(c){return c.character;}).join("").includes("UNAVAILABLE")&&
    activeFrame.cells[4][1].tone===L.tones.STATIC);
  press(ce,"JOY_DOWN");
  var selectedUnavailable=P.frame(ce.snapshot(),L);
  check("MNT-13 unavailable combination pipe sits on second value row",
    selectedUnavailable.cells[4][0].character==="|"&&selectedUnavailable.cells[3][0].character===" "&&
    selectedUnavailable.cells[4][1].tone===L.tones.STATIC);
  var previous=ce.snapshot().shortcuts.slice();
  var forbidden=press(ce,"JOY_PRESS"),forbiddenReset=press(ce,"KEY_A");
  check("Unavailable combination cannot open editor or reset assignment",
    forbidden.kind==="unavailable"&&forbiddenReset.kind==="unavailable"&&
    ce.snapshot().screen==="COMBINATIONS_1"&&same(previous,ce.snapshot().shortcuts));
  press(ce,"JOY_UP"); // select RELEASED combo 0
  press(ce,"JOY_PRESS");
  check("Assigned shortcut automatically opens its own page with focus",
    ce.snapshot().screen==="SHORTCUTS_5"&&ce.snapshot().selection===0);
  var shortFrame=P.frame(ce.snapshot(),L);
  check("Existing assigned shortcut is focused pastel cyan in editor",
    shortFrame.cells[1][1].tone===L.tones.SELECTED_CURRENT&&shortFrame.cells[1][0].character==="|");
  press(ce,"JOY_LEFT");
  check("Shortcut page 5 left goes to page 4",ce.snapshot().screen==="SHORTCUTS_4");
  press(ce,"JOY_RIGHT");
  check("Returning to applied shortcut page restores assignment focus",
    ce.snapshot().screen==="SHORTCUTS_5"&&ce.snapshot().selection===0);
  press(ce,"JOY_DOWN");
  var proposed=press(ce,"KEY_A");
  check("Apply proposes ordinal 26 ZOOM IN without changing saved state before confirmation",
    proposed.kind==="set-shortcut"&&proposed.payload.combination===0&&proposed.payload.shortcut===26&&
    ce.snapshot().shortcuts[0]===25&&ce.snapshot().screen==="SHORTCUTS_5");
  var update=combVirtual.profileFor(comboId);update.shortcuts[proposed.payload.combination]=proposed.payload.shortcut;
  combVirtual.applyProfile(comboId,update);ce.syncMice(combVirtual.snapshot(),"profile-applied");ce.confirmShortcut(0,26);
  check("Commit-first shortcut apply returns to original COMBINATIONS selection",
    ce.snapshot().screen==="COMBINATIONS_1"&&ce.snapshot().selection===0&&
    ce.snapshot().shortcuts[0]===26);
  var latest=P.frame(ce.snapshot(),L);
  check("COMBINATIONS shows full saved ZOOM IN name, not CUSTOMIZED",
    latest.cells[2].map(function(c){return c.character;}).join("").includes("ZOOM IN"));
  var resetReq=press(ce,"KEY_A");
  check("KEY A reset requests shortcut 0 without mutating before persistence",
    resetReq.kind==="reset-shortcut"&&resetReq.payload.combination===0&&
    ce.snapshot().shortcuts[0]===26);
  update=combVirtual.profileFor(comboId);update.shortcuts[0]=0;
  combVirtual.applyProfile(comboId,update);ce.syncMice(combVirtual.snapshot(),"profile-applied");ce.confirmShortcut(0,0);
  check("Reset selected combination returns to NOT CUSTOMIZED",
    ce.snapshot().shortcuts[0]===0&&ce.snapshot().screen==="COMBINATIONS_1"&&
    P.frame(ce.snapshot(),L).cells[2].map(function(c){return c.character;}).join("").includes("NOT CUSTOMIZED"));
  var noReset=press(ce,"KEY_A");
  check("A zero assignment cannot be reset again",noReset.kind==="no-action");
  var copyChanged=combVirtual.profileFor(comboId);copyChanged.kind="PASSTHROUGH";copyChanged.shortcuts[0]=30;
  combVirtual.applyProfile(comboId,copyChanged);ce.syncMice(combVirtual.snapshot(),"profile-applied");
  ce.inspect("MOUSE_OPTIONS");
  check("Passthrough never colors Modifier Shortcuts cyan with stored Modifier",
    !ce.snapshot().modifierShortcutsActive&&P.frame(ce.snapshot(),L).cells[3][1].tone!==L.tones.CURRENT);
  ce.inspect("COMBINATIONS_1");
  var passFrame=P.frame(ce.snapshot(),L);
  check("Stored shortcut in Passthrough stays gray (not cyan) on combination",
    passFrame.cells[2][1].tone!==L.tones.SELECTED_CURRENT&&passFrame.cells[2][1].tone!==L.tones.CURRENT);
  var persistedComb=V.create({storage:combStore});
  check("Reload preserves all 12 stored assignments independently from profile kind",
    persistedComb.profileFor(comboId).shortcuts.length===12&&persistedComb.profileFor(comboId).shortcuts[0]===30);
  // Draft modifier must not activate the turquoise Modifier Shortcuts indicator.
  var noModifier=combVirtual.profileFor(comboId);noModifier.kind="CUSTOM";noModifier.targets=[0,1,2,3,4];
  combVirtual.applyProfile(comboId,noModifier);ce.syncMice(combVirtual.snapshot(),"profile-applied");
  ce.inspect("EDIT_CUSTOM");press(ce,"JOY_PRESS");
  for(var i=0;i<5;i++)press(ce,"JOY_DOWN");
  press(ce,"KEY_A");ce.inspect("MOUSE_OPTIONS");
  check("Unapplied Modifier draft leaves cyan disabled until Custom Apply",
    ce.snapshot().customDirty&&!ce.snapshot().modifierShortcutsActive&&
    P.frame(ce.snapshot(),L).cells[3][1].tone!==L.tones.CURRENT);

  // WEB-09: scenarios never touch the real browser's persisted virtual mice.
  check("Eight reproducible current-UX scenarios, no deprecated v1 screens",
    D.scenarios.length===8&&D.scenarios[0].id==="first-use"&&
    D.scenarios[7].id==="shortcuts");
  var dg=D.create({lcd:L,hat:H,projector:P,virtual:V});
  var realBefore=JSON.stringify(profiles.snapshot().mice);
  var scenarioOne=dg.run("first-use");
  check("First use without any saved device starts canonical SEARCHING FIRST",
    scenarioOne.screen==="SEARCHING_FIRST"&&scenarioOne.virtual.savedCount===0);
  check("Scenario creates no durable browser storage",
    !scenarioOne.virtual.durable&&JSON.stringify(profiles.snapshot().mice)===realBefore);
  var scenarioConnected=dg.run("connected");
  check("Connected scenario reaches HOME with one separate virtual bond",
    scenarioConnected.screen==="HOME"&&scenarioConnected.virtual.savedCount===1&&
    scenarioConnected.virtual.connectedId);
  var stableHash=scenarioConnected.hash;
  var scenarioRepeat=dg.run("connected");
  check("Repeated connected scenario produces exactly the same state hash",
    scenarioRepeat.hash===stableHash&&/^[0-9a-f]{8}$/.test(stableHash));
  check("Hash is sensitive to inputs and not fixed between different scenarios",
    scenarioOne.hash!==scenarioConnected.hash&&
    D.checksum("a")!==D.checksum("b"));
  var scenarioMulti=dg.run("multi-mouse");
  check("Multiple-saved-mouse scenario creates exactly two unique local mice",
    scenarioMulti.virtual.savedCount===2&&
    scenarioMulti.events.filter(function(e){return e.kind==="paired";}).length===2);
  var scenarioRemove=dg.run("remove-device");
  check("Remove scenario leaves one mouse and opens Saved Devices",
    scenarioRemove.screen==="SAVED_DEVICES"&&scenarioRemove.virtual.savedCount===1);
  var scenarioFail=dg.run("stale-fail");
  check("Stale/fail scenario never bonds a stale mouse",
    scenarioFail.virtual.savedCount===0&&scenarioFail.screen==="RETRY_PAIR_NEW"&&
    scenarioFail.events.some(function(e){return e.kind==="stale";})&&
    scenarioFail.events.some(function(e){return e.kind==="failed";}));
  var scenarioTimeout=dg.run("timeout");
  check("Saved search timeout reaches HOME RETRY without new mouse bond",
    scenarioTimeout.screen==="HOME_RETRY"&&scenarioTimeout.virtual.savedCount===1&&
    scenarioTimeout.events.some(function(e){return e.kind==="timeout";}));
  var scenarioMovement=dg.run("movement-custom");
  check("Custom+Movement scenario has applied rotation 90 and H 2x",
    scenarioMovement.screen==="MOVEMENT_OPTIONS"&&
    scenarioMovement.state.activeProfile==="CUSTOM"&&
    scenarioMovement.state.movement.horizontal===8&&
    scenarioMovement.state.movement.rotation===1);
  var scenarioShortcuts=dg.run("shortcuts");
  check("Shortcut scenario has Modifier and assigned ZOOM IN on its first combo",
    scenarioShortcuts.screen==="COMBINATIONS_1"&&
    scenarioShortcuts.state.modifierShortcutsActive&&
    scenarioShortcuts.state.shortcuts[0]===26);
  check("Scenario LCD frame is still a canonical 9x21 grid with 240x240 geometry",
    scenarioShortcuts.geometry.width===240&&scenarioShortcuts.geometry.height===240&&
    dg.frame().cells.length===9&&dg.frame().cells[0].length===21);
  var selectedGlyph=dg.inspectPixel(7,8);
  check("Semantic glyph lookup returns source screen/row/col and exact 240px bounds",
    !!selectedGlyph&&selectedGlyph.id==="LCD/COMBINATIONS_1/ROW_01/COL_01"&&
    selectedGlyph.character==="C"&&selectedGlyph.bounds.x===7&&
    selectedGlyph.bounds.y===8&&selectedGlyph.bounds.width===10&&selectedGlyph.bounds.height===14);
  check("Inspector selection stores same current semantic ID and tone",
    dg.snapshot().selection.id===selectedGlyph.id&&
    dg.snapshot().selection.tone===L.tones.TITLE);
  check("Hit testing rejects coordinates outside 240x240 without unsafe reads",
    dg.inspectPixel(-1,8)===null&&dg.inspectPixel(240,8)===null&&
    dg.inspectPixel(7,240)===null);
  check("Inspector refuses unsourced empty pixels and clears prior selection",
    dg.inspectPixel(235,235)===null&&dg.snapshot().selection===null);
  var jsonEvidence=JSON.parse(dg.toJSON());
  check("JSON evidence has local-only schema, deterministic hash and source text",
    jsonEvidence.schema==="remappingbridge-web-diagnostics-v1"&&
    jsonEvidence.scenario.hash===scenarioShortcuts.hash&&
    jsonEvidence.note.indexOf("not physical")>=0);
  check("Text evidence retains scenario ID, hash, logical dimensions and timeline",
    dg.toText().includes("Scenario: shortcuts")&&dg.toText().includes(scenarioShortcuts.hash)&&
    dg.toText().includes("240 x 240")&&dg.toText().includes("TIMELINE:"));
  check("Isolated playback cannot change already saved browser mouse profiles",
    JSON.stringify(profiles.snapshot().mice)===realBefore);
  check("Unknown scenario is rejected rather than fabricating a result",
    throws(function(){dg.run("STANDARD_REMAP");}));
  var historyBefore=dg.snapshot().timeline.length;
  dg.record("manual","click","unit check");
  check("Local timeline records manual commands with monotonically increasing ID",
    dg.snapshot().timeline.length===historyBefore+1&&
    dg.snapshot().timeline.slice(-1)[0].source==="manual");
  for(var n=0;n<90;n++)dg.record("test","repeat","bounded");
  check("Diagnostic event timeline remains bounded at 60 entries",
    dg.snapshot().timeline.length===60);
  dg.run("connected");
  check("Timeline recording does not pollute reproducible state hash",
    dg.snapshot().hash===stableHash);

  // End of independent virtual model tests.

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
  var touchControls=["JOY_UP","JOY_LEFT","JOY_PRESS","JOY_RIGHT","JOY_DOWN",
   "KEY_A","KEY_B","KEY_X","KEY_Y"].map(function(id){
    var el=document.createElement("button");el.setAttribute("data-touch-control",id);
    root.appendChild(el);return el;
  });
  var scenarioSelect=document.createElement("select");scenarioSelect.setAttribute("data-diagnostic-scenario","");
  var runScenario=document.createElement("button");runScenario.setAttribute("data-diagnostic-run","");
  var diagnosticHash=document.createElement("output");diagnosticHash.setAttribute("data-diagnostic-hash","");
  var diagnosticContext=document.createElement("span");diagnosticContext.setAttribute("data-diagnostic-context","");
  var diagnosticRef=document.createElement("output");diagnosticRef.setAttribute("data-diagnostic-ref","");
  var diagnosticBounds=document.createElement("p");diagnosticBounds.setAttribute("data-diagnostic-bounds","");
  var diagnosticCopy=document.createElement("button");diagnosticCopy.setAttribute("data-diagnostic-copy","");
  var diagnosticLog=document.createElement("ol");diagnosticLog.setAttribute("data-diagnostic-events","");
  var diagnosticFeedback=document.createElement("p");diagnosticFeedback.setAttribute("data-diagnostic-feedback","");
  var diagnosticCanvas=document.createElement("canvas");diagnosticCanvas.setAttribute("data-diagnostic-canvas","");
  diagnosticCanvas.width=240;diagnosticCanvas.height=240;
  [scenarioSelect,runScenario,diagnosticHash,diagnosticContext,diagnosticRef,diagnosticBounds,
    diagnosticCopy,diagnosticLog,diagnosticFeedback,diagnosticCanvas].forEach(function(x){root.appendChild(x);});
  var diagnosticExportButtons=["json","txt","png"].map(function(fmt){
    var b=document.createElement("button");b.setAttribute("data-diagnostic-export",fmt);
    root.appendChild(b);return b;
  });
  var scenarios=["first","connected","saved"].map(function(id){
   var b=document.createElement("button");b.setAttribute("data-scenario",id);root.appendChild(b);return b;
  });
  var nameInput=document.createElement("input");nameInput.setAttribute("data-mouse-name","");
  nameInput.value="Demo Mouse";root.appendChild(nameInput);
  var mouseSelect=document.createElement("select");mouseSelect.setAttribute("data-mouse-id","");root.appendChild(mouseSelect);
  ["count","connection","persistence","pending"].forEach(function(attr){
    var el=document.createElement("span");el.setAttribute("data-mouse-"+attr,"");root.appendChild(el);
  });
  var profileView=document.createElement("span");profileView.setAttribute("data-profile-summary","");root.appendChild(profileView);
  var eventsList=document.createElement("ol");eventsList.setAttribute("data-virtual-log","");root.appendChild(eventsList);
  var labActions=["pair","search","success","fail","timeout","cancel","disconnect","remove","reboot","reset"];
  var lab=labActions.map(function(id){var b=document.createElement("button");b.setAttribute("data-lab-action",id);root.appendChild(b);return b;});
  document.body.appendChild(root);
  var ctx=canvas.getContext("2d");
  check("Native browser Canvas 2D is available",!!ctx);
  if(ctx){
   var started=W.boot(document);
   check("Application boots with no backdrop option buttons",started===true&&root.querySelectorAll("[data-backdrop]").length===0);
   check("Inspector contains all 45 original screens",inspect.children.length===45);
   check("Fixed Gentle LCD is used on initial screen",same(Array.from(ctx.getImageData(0,0,1,1).data),[48,12,57,255]));
   check("Obsolete WEB-08 brightness/density controls are absent from HTML app",
     root.querySelectorAll("[data-lcd-brightness]").length===0&&
     root.querySelectorAll("[data-ui-density]").length===0);
   check("Canonical display stays at full brightness by default",
     W.getDisplay().brightness===100&&W.getDisplay().availableControls===false);
   check("WEB-09 diagnostic panel defines exactly eight deterministic cases",
     scenarioSelect.children.length===8);
   scenarioSelect.value="connected";runScenario.click();
   check("Diagnostic Run button draws HOME on separate 240x240 preview",
     W.getDiagnostics().screen==="HOME"&&
     diagnosticCanvas.getContext("2d").getImageData(0,0,1,1).data[3]===255);
   check("Diagnostic state hash displayed after an isolated scenario",
     diagnosticHash.textContent.includes(W.getDiagnostics().hash));
   check("Scenario preview doesn't overwrite real HAT canvas or saved mice",
     W.getSession().screen==="SEARCHING_FIRST"&&W.getVirtualMice().mice.length===0);
   check("Diagnostic scenario timeline shows at least one event",
     diagnosticLog.children.length>=1);
   scenarioSelect.value="timeout";runScenario.click();
   check("Diagnostic scenario control reruns a distinct timeout state",
     W.getDiagnostics().screen==="HOME_RETRY"&&diagnosticContext.textContent.includes("HOME_RETRY"));
   check("Diagnostic COPY refuses nonexistent selection with a clear message",
     (diagnosticCopy.click(),diagnosticFeedback.textContent.includes("Select a character")));
   var keySelection=new Event("keydown");
   Object.defineProperty(keySelection,"key",{value:"Enter"});
   diagnosticCanvas.dispatchEvent(keySelection);
   check("Keyboard ENTER selects a semantic LCD glyph without pointing",
     !!W.getDiagnostics().selection&&W.getDiagnostics().selection.id.indexOf("LCD/HOME/ROW_01")===0);
   check("Semantic inspector exposes exact source coordinates in UI",
     diagnosticRef.textContent===W.getDiagnostics().selection.id&&
     diagnosticBounds.textContent.includes("row 1"));
   diagnosticExportButtons[0].click();
   check("JSON evidence export is local and produces successful UI confirmation",
     diagnosticFeedback.textContent.includes("Local JSON evidence downloaded"));
   diagnosticExportButtons[1].click();
   check("TXT evidence export is local and produces successful UI confirmation",
     diagnosticFeedback.textContent.includes("Local TXT evidence downloaded"));
   diagnosticCanvas.toDataURL=function(){return "data:image/png;base64,UE5H";};
   diagnosticExportButtons[2].click();
   check("PNG export uses local 240x240 diagnostic Canvas and a download action",
     diagnosticFeedback.textContent.includes("Local PNG evidence downloaded")&&
     diagnosticCanvas.width===240&&diagnosticCanvas.height===240);

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
   check("Lock still makes effective LCD brightness zero with no WEB-08 slider",
     W.getDisplay().effectiveBrightness===0&&
     root.querySelectorAll("[data-lcd-brightness]").length===0);
   keys[5].click();
   check("An unlock action is consumed and returns HOME",!W.getSession().locked&&W.getSession().screen==="HOME");
   check("Unlock restores constant 100% display without old brightness controls",
     W.getDisplay().effectiveBrightness===100&&
     canvas.getAttribute("style")==="filter:brightness(1);");
   touchControls[0].click();touchControls[4].click();
   check("Accepted large mobile HAT touch controls remain functional",
     W.getSession().screen==="HOME"&&W.getSession().selection===0);
   reset.click();
   check("Clear resets only counters and pressed state",counter.textContent==="00"&&feedback.textContent==="Ready for virtual controls.");
   check("Virtual Mouse Lab initialized with no real connected device",W.getVirtualMice().mice.length===0&&!!W.getVirtualMice().schema);
   nameInput.value="Test Work Mouse";lab[0].click();
   check("Pair button starts a local pairing attempt",W.getVirtualMice().pending.name==="Test Work Mouse");
   lab[2].click();
   check("Profile summary initially shows the selected virtual mouse",profileView.textContent.indexOf("PASSTHROUGH")>=0);
   check("Pair success adds a saved virtual mouse and shows first connected screen",
     W.getVirtualMice().mice.length===1&&W.getVirtualMice().connectedId!==null&&
     W.getSession().screen==="MOUSE_SAVED");
   // End-to-end HAT-to-persisted-profile integration through app.js handlers.
   scenarios[1].click();
   keys[2].click(); // HOME > MOUSE_OPTIONS
   keys[4].click();keys[2].click(); // CUSTOM
   keys[2].click(); // LEFT WILL BECOME
   for(var buttonStep=0;buttonStep<5;buttonStep++)keys[4].click();
   keys[5].click(); // draft Modifier
   check("End-to-end Custom draft is not persisted until second A",
     W.getSession().screen==="EDIT_CUSTOM"&&W.getSession().customDirty&&
     W.getVirtualMice().mice[0].profile.kind==="PASSTHROUGH");
   keys[5].click(); // apply custom
   check("End-to-end Custom APPLY stores one Modifier and returns to MOUSE OPTIONS",
     W.getVirtualMice().mice[0].profile.kind==="CUSTOM"&&
     W.getVirtualMice().mice[0].profile.targets[0]===5&&
     W.getSession().screen==="MOUSE_OPTIONS");
   keys[6].click(); // home
   keys[4].click();keys[2].click(); // movement
   keys[2].click(); // horizontal slow
   keys[3].click(); // fast
   keys[4].click();keys[5].click(); // fast 1.5x apply
   check("End-to-end Horizontal DPI commit persists 1.5x via A",
     W.getSession().screen==="MOVEMENT_OPTIONS"&&
     W.getVirtualMice().mice[0].profile.movement.horizontal===6);
   keys[4].click();keys[4].click();keys[2].click(); // rotation
   keys[4].click();keys[5].click(); // 90 degree apply
   check("End-to-end Rotation commit persists 90 degrees",
     W.getVirtualMice().mice[0].profile.movement.rotation===1);
   keys[5].click(); // Reset All on MOVEMENT_OPTIONS
   check("End-to-end Reset Movement keeps applied Custom profile intact",
     W.getVirtualMice().mice[0].profile.movement.horizontal===4&&
     W.getVirtualMice().mice[0].profile.movement.rotation===0&&
     W.getVirtualMice().mice[0].profile.kind==="CUSTOM");
   // WEB-07 end-to-end: actual browser HAT controls commit and reset.
   keys[6].click(); // B from Movement to Home
   keys[2].click(); // HOME -> MOUSE_OPTIONS (selection reset to zero)
   keys[4].click();keys[4].click();keys[2].click(); // MODIFIER SHORTCUTS
   check("End-to-end HAT reaches COMBINATIONS 1 OF 6 after applying Custom",
     W.getSession().screen==="COMBINATIONS_1"&&W.getSession().modifierShortcutsActive);
   keys[2].click(); // First combination -> SHORTCUTS_1
   keys[5].click(); // A applies COPY
   check("End-to-end A assigns COPY to Modifier Released and returns",
     W.getSession().screen==="COMBINATIONS_1"&&
     W.getVirtualMice().mice[0].profile.shortcuts[0]===1);
   keys[5].click(); // A resets combo 0
   check("End-to-end A resets Modifier Released to NOT CUSTOMIZED",
     W.getVirtualMice().mice[0].profile.shortcuts[0]===0&&
     W.getSession().screen==="COMBINATIONS_1");
   keys[3].click(); // COMBINATIONS_2 first is MOD + LEFT
   var unavailableScreen=W.getSession().screen;
   keys[2].click();
   check("End-to-end unavailable Left Modifier slot cannot enter shortcut editor",
     unavailableScreen==="COMBINATIONS_2"&&W.getSession().screen===unavailableScreen&&
     W.getVirtualMice().mice[0].profile.shortcuts[2]===0);
   lab[6].click();
   check("Disconnect button preserves saved device but returns saved search",
     W.getVirtualMice().connectedId===null&&W.getSession().screen==="HOME_SEARCHING");
   lab[1].click();lab[4].click();
   check("Advance-to-timeout button shows retry state without spontaneous pairing",
     W.getVirtualMice().pending===null&&W.getSession().screen==="HOME_RETRY");
   lab[1].click();lab[2].click();
   check("Saved search success reconnects the same saved ID",
     W.getVirtualMice().mice.length===1&&W.getVirtualMice().connectedId===W.getVirtualMice().frontId);
   var eventsBeforeListenerCheck=W.getVirtualMice().events.length;
   lab[1].click();
   var eventsAfterOneClick=W.getVirtualMice().events.length;
   lab[5].click();
   check("One Mouse Lab button click produces exactly one event despite repeated rendering",
     eventsAfterOneClick===eventsBeforeListenerCheck+1&&
     W.getVirtualMice().events.length===eventsBeforeListenerCheck+2);
   lab[7].click();
   check("Removing connected mouse restores FIRST without stale bonds",
     W.getVirtualMice().mice.length===0&&W.getSession().screen==="SEARCHING_FIRST");
   lab[9].click();
   check("Clear All leaves a valid empty virtual schema",W.getVirtualMice().seq===0&&W.getVirtualMice().mice.length===0);

  }
  root.remove();
 }
 resultNode.replaceChildren();
 tests.forEach(function(item){var li=document.createElement("li");li.className=item.pass?"pass":"fail";li.textContent=(item.pass?"PASS — ":"FAIL — ")+item.name;resultNode.appendChild(li);});
 var ok=tests.filter(function(t){return t.pass;}).length;
 summary.textContent=ok+"/"+tests.length+" checks passed.";
 summary.className=ok===tests.length?"pass":"fail";
 window.__WEB09_TEST_RESULT__={passed:ok,total:tests.length};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});
else run();
}());
