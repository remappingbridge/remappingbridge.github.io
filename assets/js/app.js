/* WEB-05 — canonical LCD, HAT, simulated mouse bonds and local persistence.
 * Virtual pairing is browser-only; no actual BLE/HID hardware is accessed.
 */
(function () {
  "use strict";
  var FIRMWARE=Object.freeze({
    name:"RemappingBridge",version:"v3.2.4",
    uiBaseline:"v3.2.3",
    commit:"69a640d9767ec7198572eb9b5073ed71f8f3d202",
    uiBaselineCommit:"f38c5fd15c68ea9a36d3b05912727788d7b98e81",
    gate:"WEB-05",lcdMode:"Canvas 240x240 RGB565 glyph preview",
    framebufferImplemented:true,hatInteractionImplemented:true,
    uxImplemented:true,bluetoothImplemented:false,virtualMiceImplemented:true,maxWebBrightnessPercent:100
  });
  var LABELS=Object.freeze({
    JOY_UP:"JOY UP",JOY_DOWN:"JOY DOWN",JOY_LEFT:"JOY LEFT",
    JOY_RIGHT:"JOY RIGHT",JOY_PRESS:"JOY PRESS",
    KEY_A:"KEY A",KEY_B:"KEY B",KEY_X:"KEY X",KEY_Y:"KEY Y"
  });
  var KEYBOARD=Object.freeze({
    ArrowUp:"JOY_UP",ArrowDown:"JOY_DOWN",ArrowLeft:"JOY_LEFT",
    ArrowRight:"JOY_RIGHT",Enter:"JOY_PRESS"," ":"JOY_PRESS",
    a:"KEY_A",b:"KEY_B",x:"KEY_X",y:"KEY_Y"
  });
  var INITIAL=Object.freeze([
    "SEARCHING FIRST MOUSE","PRESS TO LEARN KEYS","WHILE WAIT CONNECTION",
    "       JOY UP","  JOY    JOY    JOY","  LEFT  PRESS  RIGHT",
    "      JOY DOWN"," KEY A         KEY X"," KEY B         KEY Y"
  ]);
  function isValidPreview(rows){
    return Array.isArray(rows)&&rows.length===9&&rows.every(function(s){
      return typeof s==="string"&&s.length<=21;
    });
  }
  function controlLabel(value){
    return Object.prototype.hasOwnProperty.call(LABELS,value)?LABELS[value]:null;
  }
  function isEditable(target){
    if(!target)return false;
    if(target.isContentEditable)return true;
    var tag=(target.tagName||"").toUpperCase();
    return /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(tag);
  }
  function keyControl(key){
    var canonical=typeof key==="string"&&key.length===1?key.toLowerCase():key;
    return Object.prototype.hasOwnProperty.call(KEYBOARD,canonical)?KEYBOARD[canonical]:null;
  }
  var currentEngine=null,currentMice=null;
  function boot(doc){
    if(doc.documentElement&&doc.documentElement.lang!=="en")
      throw new Error("RemappingBridge pages must declare English (lang=en)");
    var root=doc.querySelector("[data-app-root]");
    if(!root)return false;
    var lcd=window.RemappingBridgeLCD,hat=window.RemappingBridgeHAT;
    var catalog=window.RemappingBridgeScreens,projector=window.RemappingBridgeProjector;
    var virtual=window.RemappingBridgeVirtualMice;
    var canvas=root.querySelector("[data-lcd-canvas]");
    var feedback=root.querySelector("[data-feedback]");
    var count=root.querySelector("[data-count]");
    var clear=root.querySelector("[data-reset]");
    var buttons=Array.prototype.slice.call(root.querySelectorAll("[data-control]"));
    var inspector=root.querySelector("[data-screen-inspector]");
    var scenarios=Array.prototype.slice.call(root.querySelectorAll("[data-scenario]"));
    var screenLabel=root.querySelector("[data-screen-label]");
    var mouseName=root.querySelector("[data-mouse-name]");
    var mouseSelect=root.querySelector("[data-mouse-id]");
    var mouseCount=root.querySelector("[data-mouse-count]");
    var mouseConnection=root.querySelector("[data-mouse-connection]");
    var mousePersistence=root.querySelector("[data-mouse-persistence]");
    var mousePending=root.querySelector("[data-mouse-pending]");
    var mouseLog=root.querySelector("[data-virtual-log]");
    var labButtons=Array.prototype.slice.call(root.querySelectorAll("[data-lab-action]"));
    if(!lcd||!hat||!catalog||!projector||!virtual||!canvas||!feedback||!count||!clear||!screenLabel||!inspector||
       !mouseName||!mouseSelect||!mouseCount||!mouseConnection||!mousePersistence||!mousePending||!mouseLog||labButtons.length!==10||
       catalog.ids.length!==45||buttons.length!==9||scenarios.length!==3||
       !isValidPreview(INITIAL))throw new Error("WEB-03: invalid DOM/renderer contract");

    var seen=new Set();
    buttons.forEach(function(b){
      var id=b.getAttribute("data-control");
      if(!controlLabel(id)||seen.has(id))throw new Error("WEB-03: invalid HAT control");
      seen.add(id);
    });
    var taps=0;
    var mice=virtual.create();
    currentMice=mice;
    var lastAttemptMode=null;
    var engine=hat.createEngine(onEngineEvent);
    currentEngine=engine;
    var buttonById={};
    buttons.forEach(function(button){buttonById[button.getAttribute("data-control")]=button;});
    var keyboardDown=new Map();
    var pointerClickConsumed=new Set();
    var blackFrame=lcd.newFrame(Array(9).fill(""),{hintStartRow:9});

    function currentFrame(state){
      return projector.frame(state,lcd);
    }
    catalog.ids.forEach(function(id){
      var entry=catalog.get(id),option=doc.createElement("option");
      option.value=id;
      option.textContent=id.replace(/_/g," ")+" — "+entry.rows[0].slice(0,21);
      inspector.appendChild(option);
    });
    inspector.addEventListener("change",function(){
      if(engine.snapshot().locked)return;
      engine.inspect(inspector.value);
    });
    function paint(){
      var state=engine.snapshot();
      lcd.render(canvas,state.locked?blackFrame:currentFrame(state),"gentle");
      canvas.setAttribute("aria-label",state.locked?
        "Virtual LCD locked. Press and release one HAT control to unlock.":
        "Virtual 240 by 240 firmware LCD: "+hat.templates[state.screen][0]+
        ". No physical mouse is connected.");
      root.setAttribute("data-demo-screen",state.screen);
      root.setAttribute("data-locked",state.locked?"true":"false");
      screenLabel.textContent=state.locked?"LCD LOCKED":hat.templates[state.screen][0].slice(0,21);
      inspector.value=state.screen;
      buttons.forEach(function(b){
        b.classList.toggle("is-pressed",state.held.indexOf(b.getAttribute("data-control"))!==-1);
      });
      mouseSelect.addEventListener("change",function(){
      if(engine.snapshot().locked)return;
      var id=mouseSelect.value;
      if(id)mice.selectFront(id);
    });
    labButtons.forEach(function(button){
      button.addEventListener("click",function(){
        if(engine.snapshot().locked)return;
        var action=button.getAttribute("data-lab-action");
        try{
          if(action==="pair")mice.beginPair(mouseName.value);
          else if(action==="search")mice.beginSearch(mouseSelect.value);
          else if(action==="success")mice.complete(true);
          else if(action==="fail")mice.complete(false);
          else if(action==="timeout")mice.advance(mice.timeoutTicks);
          else if(action==="cancel")mice.cancel("operator");
          else if(action==="disconnect")mice.disconnect();
          else if(action==="remove")mice.remove(mouseSelect.value);
          else if(action==="reboot")mice.reboot();
          else if(action==="reset")mice.reset();
        }catch(error){announce("Virtual lab: "+error.message);}
      });
    });
    scenarios.forEach(function(b){b.disabled=state.locked;});
    }
    function announce(message){
      feedback.textContent=message;count.textContent=String(taps).padStart(2,"0");
    }
    function renderMice(){
      var state=mice.snapshot();
      mouseCount.textContent=state.mice.length+" / 8 saved";
      var connected=state.mice.find(function(m){return m.id===state.connectedId;});
      mouseConnection.textContent=connected?"Connected: "+connected.name:"Disconnected";
      mousePersistence.textContent=state.durable?"Saved in this browser":"Memory only — storage unavailable";
      mousePending.textContent=state.pending?
        "Pending "+(state.pending.mode==="pair"?"pairing":"saved search")+
        " for "+state.pending.name+" (tick "+state.clock+"/"+state.pending.dueAt+").":
        "No pending virtual connection. Tick "+state.clock+".";
      mouseSelect.replaceChildren();
      if(!state.mice.length){
        var empty=doc.createElement("option");empty.value="";
        empty.textContent="No saved virtual mice";mouseSelect.appendChild(empty);
        mouseSelect.value="";
      }else{
        state.mice.forEach(function(m){
          var option=doc.createElement("option");option.value=m.id;
          option.textContent=m.name+" ("+m.id+")";
          mouseSelect.appendChild(option);
        });
        mouseSelect.value=state.frontId||state.mice[0].id;
      }
      mouseLog.replaceChildren();
      state.events.forEach(function(item){
        var li=doc.createElement("li");
        li.textContent="Tick "+item.at+" — "+item.text;
        mouseLog.appendChild(li);
      });
      labButtons.forEach(function(b){
        var action=b.getAttribute("data-lab-action");
        var needsPending=action==="success"||action==="fail"||action==="cancel";
        var needsSaved=action==="search"||action==="remove";
        b.disabled=(needsPending&&!state.pending)||(needsSaved&&!state.mice.length)||engine.snapshot().locked;
      });
    }
    function onVirtualEvent(event){
      var state=event.state;
      if(event.kind==="started"&&state.pending)lastAttemptMode=state.pending.mode;
      var reason=event.kind;
      if(event.kind==="started")reason="started-"+lastAttemptMode;
      if(event.kind==="failed"||event.kind==="timeout")reason=event.kind+"-"+(lastAttemptMode||"pair");
      engine.syncMice(state,reason);
      renderMice();
      announce(event.text+(state.durable?" Saved locally.":" Memory only; this change may not survive a reload."));
    }
    mice.subscribe(onVirtualEvent);
    function onEngineEvent(event){
      paint();
      if(event.kind==="mice-updated")return;
      if(event.kind==="lock"||event.kind==="unlock")renderMice();
      if(event.kind==="remove-request"){mice.remove(event.control);return;}
      if(event.kind==="access"&&event.state.screen==="PAIR_MOUSE"){
        try{mice.beginPair(mouseName.value);}catch(error){announce(error.message);}
        return;
      }
      if(event.kind==="retry"&&event.state.screen==="PAIR_MOUSE"){
        try{mice.beginPair(mouseName.value);}catch(error){announce(error.message);}
        return;
      }
      if(event.kind==="retry"&&event.state.screen==="HOME_SEARCHING"&&mice.snapshot().mice.length){
        mice.beginSearch();return;
      }
      if(event.kind==="page"&&event.state.screen==="SAVED_DEVICES"){
        var target=event.state.savedMice[event.state.savedPage];
        if(target){mice.selectFront(target.id);return;}
      }
      if(event.kind==="cancel-search"&&mice.snapshot().pending){mice.cancel("Back");return;}
      if(event.kind==="back"&&mice.snapshot().pending){mice.cancel("Back");return;}

      var label=controlLabel(event.control)||"HAT";
      switch(event.kind){
        case "press":case "repeat":case "ignored":case "cancel":return;
        case "lock":announce("LCD locked. Press and release any HAT control to unlock.");break;
        case "unlock":announce("LCD unlocked. The unlock control was consumed.");break;
        case "help":announce("Help opened. B returns; Y locks the LCD.");break;
        case "back":announce("Returned from Help.");break;
        case "help-ignored":announce("Help: only B returns and Y locks.");break;
        case "selection":announce(label+" — focused menu option changed.");break;
        case "access":announce("Opened "+hat.templates[event.state.screen][0].slice(0,21)+".");break;
        case "page":announce("Moved to another option page.");break;
        case "inspect":announce("Inspecting canonical firmware screen: "+event.state.screen+".");break;
        case "commit-pending":announce("Preview only: "+event.control+" will be simulated in a later gate. No settings saved.");break;
        case "scenario":announce("Virtual state: "+hat.templates[event.state.screen][0]+".");break;
        case "didactic":announce(label+" — tutorial input; no menu action.");break;
        case "retry":announce("Virtual saved-mouse search restarted.");break;
        case "cancel-search":announce("Virtual saved-mouse search canceled.");break;
        default:announce(label+" — no action on this screen.");
      }
      if(event.control&&event.kind!=="ignored"&&event.kind!=="press"&&
         event.kind!=="repeat"&&event.kind!=="cancel") {
        taps++;count.textContent=String(taps).padStart(2,"0");
      }
    }
    function tap(id){engine.press(id);engine.release(id);}
    function cancelHeld(){
      keyboardDown.clear();
      engine.cancelAll();
      buttons.forEach(function(b){b.classList.remove("is-pressed");});
      paint();
    }
    buttons.forEach(function(b){
      var id=b.getAttribute("data-control"),hadPointer=false;
      b.addEventListener("pointerdown",function(event){
        hadPointer=true;
        if(event&&typeof b.setPointerCapture==="function"&&event.pointerId!==undefined){
          try{b.setPointerCapture(event.pointerId);}catch(_){}
        }
        engine.press(id);
      });
      b.addEventListener("pointerup",function(){
        if(!hadPointer)return;
        hadPointer=false;
        engine.release(id);
        pointerClickConsumed.add(id);
      });
      b.addEventListener("pointercancel",function(){hadPointer=false;cancelHeld();});
      b.addEventListener("lostpointercapture",function(){
        if(hadPointer){hadPointer=false;cancelHeld();}
      });
      b.addEventListener("blur",function(){if(hadPointer){hadPointer=false;cancelHeld();}});
      b.addEventListener("click",function(event){
        if(pointerClickConsumed.has(id)&&event&&event.detail>0){
          pointerClickConsumed.delete(id);return;
        }
        pointerClickConsumed.delete(id);
        // Native accessibility click (Space/Enter on focused button)
        // and programmatic click go through this single press/release path.
        if(!hadPointer)tap(id);
      });
    });
    scenarios.forEach(function(b){
      var name=b.getAttribute("data-scenario");
      if(hat.scenarios.indexOf(name)===-1)throw new Error("WEB-03: invalid scenario");
      b.addEventListener("click",function(){
        if(engine.snapshot().locked)return;
        engine.setScenario(name);
        scenarios.forEach(function(p){
          var selected=p.getAttribute("data-scenario")===name;
          p.classList.toggle("is-selected",selected);
          p.setAttribute("aria-pressed",selected?"true":"false");
        });
      });
    });
    doc.addEventListener("keydown",function(event){
      if(event.ctrlKey||event.altKey||event.metaKey||isEditable(event.target))return;
      var id=keyControl(event.key);
      if(!id)return;
      if(typeof event.preventDefault==="function")event.preventDefault();
      if(event.repeat||keyboardDown.has(event.key))return;
      keyboardDown.set(event.key,id);engine.press(id);
    });
    doc.addEventListener("keyup",function(event){
      var id=keyboardDown.get(event.key);
      if(!id)return;
      if(typeof event.preventDefault==="function")event.preventDefault();
      keyboardDown.delete(event.key);
      engine.release(id);
    });
    doc.addEventListener("visibilitychange",function(){
      if(doc.visibilityState==="hidden")cancelHeld();
    });
    if(typeof window.addEventListener==="function")
      window.addEventListener("blur",cancelHeld);
    clear.addEventListener("click",function(){
      cancelHeld();taps=0;announce("Ready for virtual controls.");
    });
    engine.syncMice(mice.snapshot(),"initialized");
    renderMice();
    paint();
    root.setAttribute("data-lcd-renderer","canvas-240x240");
    root.setAttribute("data-boot-state","ready");
    return true;
  }
  window.RemappingBridgeWeb=Object.freeze({
    getBootstrapInfo:function(){return FIRMWARE;},
    controlLabel:controlLabel,keyControl:keyControl,isEditable:isEditable,
    isValidPreview:isValidPreview,firstScreenTemplate:INITIAL,
    getSession:function(){return currentEngine?currentEngine.snapshot():null;},
    getVirtualMice:function(){return currentMice?currentMice.snapshot():null;},
    canonicalScreenCount:45,
    boot:boot
  });
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",function(){boot(document);},{once:true});
  else boot(document);
}());
