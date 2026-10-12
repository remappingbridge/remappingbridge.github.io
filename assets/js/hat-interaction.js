/* WEB-03 — minimal virtual HAT/Help/Lock contract.
 * Based on v3.2.4 src/interaction/interaction.c and the HOME/HELP
 * branches of src/ux_model/ux_model.c. The complete 45-screen
 * UX/transitions and BLE model belong to WEB-04/05.
 * Input is RELEASE-driven; this module never touches HID/Bluetooth.
 */
(function () {
  "use strict";
  var CONTROLS=Object.freeze([
    "JOY_UP","JOY_DOWN","JOY_LEFT","JOY_RIGHT","JOY_PRESS",
    "KEY_A","KEY_B","KEY_X","KEY_Y"
  ]);
  var SCREENS=Object.freeze({
    FIRST:"SEARCHING_FIRST",
    HOME:"HOME",
    SEARCH:"HOME_SEARCHING",
    RETRY:"HOME_RETRY",
    HOME_HELP:"HELP_HOME_CONNECTED",
    SEARCH_HELP:"HOME_SEARCHING_HELP",
    RETRY_HELP:"HOME_RETRY_HELP"
  });
  var SCREEN_TEMPLATES=Object.freeze({
    SEARCHING_FIRST:Object.freeze([
      "SEARCHING FIRST MOUSE","PRESS TO LEARN KEYS",
      "WHILE WAIT CONNECTION","       JOY UP","  JOY    JOY    JOY",
      "  LEFT  PRESS  RIGHT","      JOY DOWN"," KEY A         KEY X",
      " KEY B         KEY Y"]),
    HOME:Object.freeze([
      "DEMO MOUSE"," REMAPPING OPTIONS"," MOVEMENT OPTIONS",
      " SAVED DEVICES"," PAIR NEW MOUSE","","JOY UP / DOWN: SELECT",
      "JOY PRESS: ACCESS","KEY X: HELP TO REMOVE"]),
    HOME_SEARCHING:Object.freeze([
      "SEARCHING SAVED MOUSE"," SAVED DEVICES"," PAIR NEW MOUSE",
      "","","KEY B: CANCEL SEARCH","JOY UP / DOWN: SELECT",
      "JOY PRESS: ACCESS","KEY X: HELP"]),
    HOME_RETRY:Object.freeze([
      "DEVICE NOT FOUND"," SAVED DEVICES"," PAIR NEW MOUSE",
      "","","KEY A: RETRY SEARCH","JOY UP / DOWN: SELECT",
      "JOY PRESS: ACCESS","KEY X: HELP"]),
    HELP_HOME_CONNECTED:Object.freeze([
      "REMOVE CONNECTED HELP","TO DISCONNECT THE","CURRENTLY CONNECTED",
      "MOUSE NAVIGATE TO:","STEP 1. SAVED DEVICES",
      "STEP 2. REMOVE DEVICE","STEP 3. KEY A: REMOVE","","KEY B: BACK"]),
    HOME_SEARCHING_HELP:Object.freeze([
      "HOME SEARCHING HELP","THE MATCHING ATTEMPT","TOOK PLACE ONLY FOR",
      "DEVICES ALREADY SAVED","IN THE PREFERENCES,","BUT NOT FOR DEVICES",
      "THAT WERE NOT SAVED.","","KEY B: BACK"]),
    HOME_RETRY_HELP:Object.freeze([
      "HOME RETRY HELP","THE MATCHING ATTEMPT","TOOK PLACE ONLY FOR",
      "DEVICES ALREADY SAVED","IN THE PREFERENCES,","BUT NOT FOR DEVICES",
      "THAT WERE NOT SAVED.","","KEY B: BACK"])
  });
  var SCENARIOS=Object.freeze(["first","connected","saved"]);
  var HELP=new Set([SCREENS.HOME_HELP,SCREENS.SEARCH_HELP,SCREENS.RETRY_HELP]);
  function validControl(id){return CONTROLS.indexOf(id)!==-1;}
  function validScenario(id){return SCENARIOS.indexOf(id)!==-1;}
  function createEngine(callback) {
    var onUpdate=typeof callback==="function"?callback:function(){};
    var scenario="first", screen=SCREENS.FIRST, selection=0;
    var locked=false,unlockArmed=null,returnScreen=null,returnSelection=0;
    var held=new Set();
    function snapshot(){
      return Object.freeze({
        scenario:scenario,screen:screen,selection:selection,locked:locked,
        held:Object.freeze(Array.from(held)),unlockArmed:unlockArmed,
        returnScreen:returnScreen,returnSelection:returnSelection
      });
    }
    function notify(kind,control){
      var event=Object.freeze({kind:kind,control:control||null,state:snapshot()});
      onUpdate(event);
      return event;
    }
    function homeForScenario(){
      return scenario==="connected"?SCREENS.HOME:scenario==="saved"?SCREENS.SEARCH:SCREENS.FIRST;
    }
    function scenarioSet(value) {
      if(!validScenario(value)) throw new RangeError("Unknown demo scenario");
      // Scenario switching is explicit demo setup, unavailable when locked.
      if(locked)return notify("locked",null);
      scenario=value;screen=homeForScenario();selection=0;
      returnScreen=null;returnSelection=0;unlockArmed=null;held.clear();
      return notify("scenario",null);
    }
    function isHelp(){return HELP.has(screen);}
    function count(){return screen===SCREENS.HOME?4:(screen===SCREENS.SEARCH||screen===SCREENS.RETRY?2:0);}
    function press(control) {
      if(!validControl(control))return notify("ignored",control);
      if(held.has(control))return notify("repeat",control);
      held.add(control);
      if(locked&&!unlockArmed)unlockArmed=control;
      return notify("press",control);
    }
    function release(control) {
      if(!validControl(control)||!held.has(control))return notify("ignored",control);
      held.delete(control);
      if(locked){
        if(unlockArmed===control){
          locked=false;unlockArmed=null;held.clear();
          screen=homeForScenario();selection=0;
          returnScreen=null;returnSelection=0;
          return notify("unlock",control);
        }
        return notify("locked",control);
      }
      // Searching First is a didactic screen, not an interactive menu.
      // Even KEY Y may NOT lock here (firmware lock_allowed).
      if(screen===SCREENS.FIRST)return notify("didactic",control);
      if(isHelp()){
        if(control==="KEY_Y"){locked=true;unlockArmed=null;held.clear();return notify("lock",control);}
        if(control==="KEY_B"){
          if(screen===SCREENS.SEARCH_HELP){screen=SCREENS.RETRY;selection=0;}
          else {screen=returnScreen||homeForScenario();selection=returnSelection;}
          returnScreen=null;returnSelection=0;
          return notify("back",control);
        }
        return notify("help-ignored",control);
      }
      if(control==="KEY_Y"){
        locked=true;unlockArmed=null;held.clear();return notify("lock",control);
      }
      if(control==="KEY_X"){
        returnScreen=screen;returnSelection=selection;
        screen=screen===SCREENS.HOME?SCREENS.HOME_HELP:
          screen===SCREENS.SEARCH?SCREENS.SEARCH_HELP:SCREENS.RETRY_HELP;
        selection=0;return notify("help",control);
      }
      if(screen===SCREENS.RETRY&&control==="KEY_A"){
        screen=SCREENS.SEARCH;selection=0;return notify("retry",control);
      }
      if(screen===SCREENS.SEARCH&&control==="KEY_B"){
        screen=SCREENS.RETRY;selection=0;return notify("cancel-search",control);
      }
      if(control==="KEY_B")return notify("no-action",control);
      if(control==="JOY_UP"&&count()){
        selection=(selection+count()-1)%count();return notify("selection",control);
      }
      if(control==="JOY_DOWN"&&count()){
        selection=(selection+1)%count();return notify("selection",control);
      }
      if(control==="JOY_PRESS"&&count()){
        // Routes such as Movement, Custom, Pair New and Saved Devices
        // intentionally belong to WEB-04+. Never fabricate a device action.
        return notify("route-pending",control);
      }
      return notify("no-action",control);
    }
    function cancelAll(){
      var hadAny=held.size>0||unlockArmed!==null;
      held.clear();unlockArmed=null;  // Lost keyup must never cause an action.
      return hadAny?notify("cancel",null):snapshot();
    }
    return Object.freeze({
      press:press,release:release,cancelAll:cancelAll,
      setScenario:scenarioSet,snapshot:snapshot,
      optionCount:count,isHelp:isHelp
    });
  }
  window.RemappingBridgeHAT=Object.freeze({
    controls:CONTROLS,scenarios:SCENARIOS,screens:SCREENS,
    templates:SCREEN_TEMPLATES,createEngine:createEngine
  });
}());
