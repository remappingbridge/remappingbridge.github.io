/* WEB-04 — 45 canonical screen route model, based on firmware v3.2.4.
 * Release-driven control/Help/Lock behavior preserved from WEB-03.
 * Persistence commits and actual BLE transactions belong to WEB-05/06/07.
 */
(function () {
"use strict";
var source=window.RemappingBridgeScreens;
if(!source||source.ids.length!==45)throw new Error("WEB-04 needs 45 canonical screen templates");
var T=Object.freeze(Object.fromEntries(source.ids.map(function(id){return [id,source.get(id).rows];})));
var S=Object.freeze({
 FIRST:"SEARCHING_FIRST",HOME:"HOME",SEARCH:"HOME_SEARCHING",RETRY:"HOME_RETRY",
 HOME_HELP:"HELP_HOME_CONNECTED",SEARCH_HELP:"HOME_SEARCHING_HELP",RETRY_HELP:"HOME_RETRY_HELP"
});
var C=Object.freeze(["JOY_UP","JOY_DOWN","JOY_LEFT","JOY_RIGHT","JOY_PRESS","KEY_A","KEY_B","KEY_X","KEY_Y"]);
var SCENARIOS=Object.freeze(["first","connected","saved"]);
var HELP=new Set(source.ids.filter(function(id){return id.startsWith("HELP_")||id.endsWith("_HELP");}));
var SOURCE=Object.freeze(["LEFT","RIGHT","MIDDLE","FORWARD","BACKWARD"]);
var TARGET=Object.freeze(["LEFT","RIGHT","MIDDLE","FORWARD","BACKWARD","MODIFIER"]);
var NUM=Object.freeze({HOME:4,HOME_SEARCHING:2,HOME_RETRY:2,MOUSE_OPTIONS:3,MOVEMENT_OPTIONS:3,
 EDIT_CUSTOM:5,HORIZONTAL_SLOW_DPI:4,HORIZONTAL_FAST_DPI:4,VERTICAL_SLOW_DPI:4,
 VERTICAL_FAST_DPI:4,ROTATION:4});
function isCombo(id){return /^COMBINATIONS_[1-6]$/.test(id);}
function isShortcut(id){return /^SHORTCUTS_[1-5]$/.test(id);}
function isWill(id){return /^(LEFT|RIGHT|MIDDLE|FORWARD|BACKWARD)_WILL_BECOME$/.test(id);}
function isDpi(id){return /^(HORIZONTAL|VERTICAL)_(SLOW|FAST)_DPI$/.test(id);}
function countFor(id){return NUM[id]|| (isCombo(id)?2:isShortcut(id)?6:isWill(id)?6:0);}
function createEngine(listener){
 var cb=typeof listener==="function"?listener:function(){};
 var scenario="first",screen=S.FIRST,selection=0,locked=false,armed=null;
 var held=new Set(),returnScreen=null,returnSelection=0;
 var savedCount=0,savedPage=0,connected=true,activeProfile="PASSTHROUGH";
 var savedMice=[],connectedId=null,frontId=null,connectedName="DEMO MOUSE",removeTargetId=null;
 var customSource=0,customTargets=[0,1,2,3,4],appliedTargets=[0,1,2,3,4],customDirty=false,profileOwner=null;
 var movement={horizontal:4,vertical:4,rotation:0},editingCombination=0;
 var shortcuts=Array(12).fill(0),dpiSelection=[0,0,0,0],lastOutcome=null;
 function home(){return scenario==="first"?S.FIRST:scenario==="saved"?S.SEARCH:S.HOME;}
 function options(){return countFor(screen);}
 function snapshot(){
  return Object.freeze({scenario:scenario,screen:screen,selection:selection,locked:locked,
   held:Object.freeze(Array.from(held)),unlockArmed:armed,returnScreen:returnScreen,
   returnSelection:returnSelection,savedCount:savedCount,savedPage:savedPage,savedMice:Object.freeze(savedMice.map(function(m){return Object.freeze({id:m.id,name:m.name});})),
   connectedId:connectedId,frontId:frontId,connectedName:connectedName,removeTargetId:removeTargetId,
   connected:connected,activeProfile:activeProfile,customSource:customSource,
   customTargets:Object.freeze(customTargets.slice()),appliedTargets:Object.freeze(appliedTargets.slice()),customDirty:customDirty,profileOwner:profileOwner,
   modifierSource:customTargets.indexOf(5),
   movement:Object.freeze(Object.assign({},movement)),editingCombination:editingCombination,
   shortcuts:Object.freeze(shortcuts.slice()),lastOutcome:lastOutcome});
 }
 function emit(kind,control,payload){
  var e=Object.freeze({kind:kind,control:control||null,payload:payload?JSON.parse(JSON.stringify(payload)):null,state:snapshot()});cb(e);return e;
 }
 function go(id,focus){if(!source.get(id))throw new RangeError("Unknown canonical screen "+id);screen=id;selection=focus||0;}
 function setScenario(name){
  if(SCENARIOS.indexOf(name)===-1)throw new RangeError("Unknown scenario");
  if(locked)return emit("locked");
  scenario=name;savedCount=name==="first"?0:1;connected=name==="connected";
  savedPage=0;go(home());held.clear();returnScreen=null;returnSelection=0;armed=null;lastOutcome=null;
  return emit("scenario");
 }
 function syncMice(value,reason){
  if(!value||!Array.isArray(value.mice)||value.mice.length>8)throw new TypeError("Invalid virtual mouse snapshot");
  savedMice=value.mice.map(function(m){return {id:m.id,name:m.name};});
  savedCount=savedMice.length;frontId=value.frontId;connectedId=value.connectedId;
  connected=!!connectedId;
  var current=savedMice.find(function(m){return m.id===connectedId;});
  connectedName=current?current.name:"DEMO MOUSE";
  var target=value.mice.find(function(m){return m.id===(connectedId||frontId);});
  var owner=target?target.id:null;
  if(reason==="initialized"||reason==="profile-applied"||reason==="paired"||
     reason==="connected"||reason==="removed"||reason==="reset"||reason==="reboot"||
     owner!==profileOwner){
    profileOwner=owner;
    var profile=target&&target.profile;
    activeProfile=profile?profile.kind:"PASSTHROUGH";
    appliedTargets=profile?profile.targets.slice():[0,1,2,3,4];
    customTargets=appliedTargets.slice();customDirty=false;
    movement=profile?Object.assign({},profile.movement):{horizontal:4,vertical:4,rotation:0};
    shortcuts=profile?profile.shortcuts.slice():Array(12).fill(0);
  }

  var frontIndex=savedMice.findIndex(function(m){return m.id===frontId;});
  if(frontIndex>=0)savedPage=frontIndex;
  else savedPage=Math.min(savedPage,Math.max(0,savedCount-1));
  if(reason==="started-pair")go("PAIR_MOUSE");
  else if(reason==="started-saved")go(S.SEARCH);
  else if(reason==="timeout-pair"||reason==="failed-pair")go("RETRY_PAIR_NEW");
  else if(reason==="timeout-saved"||reason==="failed-saved")go(S.RETRY);
  else if(reason==="paired")go(savedCount===1?"MOUSE_SAVED":"HOME");
  else if(reason==="connected")go("HOME");
  else if(reason==="removed"||reason==="disconnected"||reason==="reboot"||reason==="reset"){
   scenario=connected?"connected":savedCount?"saved":"first";go(home());
  }
  else if(reason==="initialized"){
   scenario=connected?"connected":savedCount?"saved":"first";go(home());
  }
  if(reason==="paired"||reason==="connected"){scenario="connected";}
  if(reason==="started-saved"||reason==="timeout-saved"||reason==="failed-saved")scenario="saved";
  if(reason==="started-pair"||reason==="timeout-pair"||reason==="failed-pair")scenario=savedCount?"saved":"first";
  return emit("mice-updated");
 }
 function inspect(id){
  if(!source.get(id))throw new RangeError("Unknown canonical screen");
  if(locked)return emit("locked");
  go(id);held.clear();returnScreen=null;returnSelection=0;
  return emit("inspect");
 }
 function help(){return HELP.has(screen);}
 function press(id){
  if(C.indexOf(id)<0)return emit("ignored",id);
  if(held.has(id))return emit("repeat",id);
  held.add(id);if(locked&&!armed)armed=id;
  return emit("press",id);
 }
 function backTarget(){
  if(screen==="MOUSE_OPTIONS"||screen==="MOVEMENT_OPTIONS"||screen==="SAVED_DEVICES")return home();
  if(isDpi(screen)||screen==="ROTATION")return "MOVEMENT_OPTIONS";
  if(screen==="PAIR_MOUSE"||screen==="RETRY_PAIR_NEW"||screen==="MOUSE_SAVED")return home();
  if(screen==="REMOVE_THIS")return "SAVED_DEVICES";
  if(screen==="APPLY_PASSTHROUGH"||screen==="PASSTHROUGH_APPLIED"||screen==="EDIT_CUSTOM")return "MOUSE_OPTIONS";
  if(isWill(screen))return "EDIT_CUSTOM";
  if(isCombo(screen))return "MOUSE_OPTIONS";
  if(isShortcut(screen))return "COMBINATIONS_"+(Math.floor(editingCombination/2)+1);
  return home();
 }
 function helpFor(){
  if(screen==="HOME")return "HELP_HOME_CONNECTED";
  if(screen==="HOME_SEARCHING")return "HOME_SEARCHING_HELP";
  if(screen==="HOME_RETRY")return "HOME_RETRY_HELP";
  if(screen==="MOUSE_OPTIONS")return "HELP_REMAPPER_OPTIONS";
  if(screen==="REMOVE_THIS")return "HELP_REMOVE_THIS";
  if(screen==="PAIR_MOUSE")return "HELP_PAIR_NEW";
  if(screen==="RETRY_PAIR_NEW")return "HELP_RETRY_PAIR_NEW";
  if(isDpi(screen))return screen.includes("FAST")?"HELP_FAST_DPI":"HELP_SLOW_DPI";
  if(screen==="ROTATION")return "HELP_ROTATION";
  return null;
 }
 function goHelp(){
  var dest=helpFor();if(!dest)return false;
  returnScreen=screen;returnSelection=selection;go(dest);return true;
 }
 function applyVisualPlaceholder(action){
  lastOutcome=action;
  // WEB-04 intentionally does not persist a fake BLE bond, a profile,
  // a modifier/shortcut, or a Movement setting. Future gates own commits.
  return emit("commit-pending",action);
 }
 function release(id){
  if(C.indexOf(id)<0||!held.has(id))return emit("ignored",id);
  held.delete(id);
  if(locked){
   if(armed===id){
    locked=false;armed=null;held.clear();go(home());returnScreen=null;returnSelection=0;
    return emit("unlock",id);
   }
   return emit("locked",id);
  }
  if(screen===S.FIRST)return emit("didactic",id);
  if(help()){
   if(id==="KEY_Y"){locked=true;armed=null;held.clear();return emit("lock",id);}
   if(id==="KEY_B"){
    if(screen===S.SEARCH_HELP)go(S.RETRY);
    else if(screen==="HELP_PAIR_NEW")go("RETRY_PAIR_NEW");
    else{var back=returnScreen||home();var focus=returnSelection;go(back,focus);}
    returnScreen=null;returnSelection=0;return emit("back",id);
   }
   return emit("help-ignored",id);
  }
  if(id==="KEY_Y"){
   locked=true;armed=null;held.clear();return emit("lock",id);
  }
  if(screen==="MOUSE_SAVED")return emit("didactic",id);
  if(id==="KEY_X"&&goHelp())return emit("help",id);
  if(screen===S.RETRY&&id==="KEY_A"){go(S.SEARCH);return emit("retry",id);}
  if(screen===S.SEARCH&&id==="KEY_B"){go(S.RETRY);return emit("cancel-search",id);}
  if(screen==="PAIR_MOUSE"&&id==="KEY_B"){go(home());return emit("back",id);}
  if(screen==="RETRY_PAIR_NEW"&&id==="KEY_A"){go("PAIR_MOUSE");return emit("retry",id);}
  if(screen==="RETRY_PAIR_NEW"&&id==="KEY_B"){go(home());return emit("back",id);}
  if(screen==="REMOVE_THIS"&&id==="KEY_B"){go("SAVED_DEVICES");return emit("back",id);}
  if(id==="KEY_B"){
   if(isCombo(screen)){go("MOUSE_OPTIONS",2);return emit("back",id);}
   if(isShortcut(screen)){go("COMBINATIONS_"+(Math.floor(editingCombination/2)+1),editingCombination%2);return emit("back",id);}
   if(isWill(screen)){go("EDIT_CUSTOM",customSource);return emit("back",id);}
   if(screen===S.RETRY)return emit("no-action",id);
   if(screen!==S.HOME&&screen!==S.SEARCH&&screen!==S.FIRST){
    if(screen==="EDIT_CUSTOM"){
     // KEY B cancels unapplied edits; only a confirmed Apply changes storage.
     customTargets=appliedTargets.slice();customDirty=false;
    }
    go(backTarget());return emit("back",id);
   }
   return emit("no-action",id);
  }
  if(isCombo(screen)){
   var cp=Number(screen.split("_")[1]);
   if(id==="JOY_LEFT"||id==="JOY_RIGHT"){go("COMBINATIONS_"+((cp-1+(id==="JOY_LEFT"?5:1))%6+1),selection);return emit("page",id);}
   if(id==="JOY_PRESS"){editingCombination=(cp-1)*2+selection;go("SHORTCUTS_1");return emit("access",id);}
   if(id==="KEY_A")return applyVisualPlaceholder("RESET_SHORTCUT");
   if(id==="KEY_X")return emit("no-action",id);
  }
  if(isShortcut(screen)){
   var sp=Number(screen.split("_")[1]);
   if(id==="JOY_LEFT"||id==="JOY_RIGHT"){go("SHORTCUTS_"+((sp-1+(id==="JOY_LEFT"?4:1))%5+1),selection);return emit("page",id);}
   if(id==="KEY_A")return applyVisualPlaceholder("SET_SHORTCUT");
   if(id==="JOY_PRESS"||id==="KEY_X")return emit("no-action",id);
  }
  if(options()&&id==="JOY_UP"){selection=(selection+options()-1)%options();return emit("selection",id);}
  if(options()&&id==="JOY_DOWN"){selection=(selection+1)%options();return emit("selection",id);}
  if(screen===S.HOME&&id==="JOY_PRESS"){
   go(["MOUSE_OPTIONS","MOVEMENT_OPTIONS","SAVED_DEVICES","PAIR_MOUSE"][selection]);return emit("access",id);
  }
  if((screen===S.SEARCH||screen===S.RETRY)&&id==="JOY_PRESS"){
   go(["SAVED_DEVICES","PAIR_MOUSE"][selection]);return emit("access",id);
  }
  if(screen==="MOUSE_OPTIONS"){
   if(id==="JOY_LEFT"){go(home());return emit("back",id);}
   if(id==="JOY_PRESS"){
    if(selection===0)go(activeProfile==="PASSTHROUGH"?"PASSTHROUGH_APPLIED":"APPLY_PASSTHROUGH");
    else if(selection===1)go("EDIT_CUSTOM");
    else go("COMBINATIONS_1");
    return emit("access",id);
   }
  }
  if(screen==="MOVEMENT_OPTIONS"){
   if(id==="KEY_A")return emit("reset-movement",id,{movement:{horizontal:4,vertical:4,rotation:0}});
   if(id==="JOY_PRESS"){
    var axis=selection;
    if(axis===2)go("ROTATION",movement.rotation);
    else{
     var horizontal=axis===0,gain=horizontal?movement.horizontal:movement.vertical;
     var fast=gain>4;
     var page=(horizontal?"HORIZONTAL":"VERTICAL")+"_"+(fast?"FAST":"SLOW")+"_DPI";
     var choices=fast?[5,6,8,12]:[4,3,2,1];
     go(page,Math.max(0,choices.indexOf(gain)));
    }
    return emit("access",id);
   }
  }
  if(isDpi(screen)||screen==="ROTATION"){
   if(isDpi(screen)&&(id==="JOY_LEFT"||id==="JOY_RIGHT")){
    var parts=screen.split("_"),fast=parts[1]==="FAST",axis=parts[0];
    dpiSelection[axis+"_"+parts[1]]=selection;
    var nextFast=!fast;
    var dest=axis+"_"+(nextFast?"FAST":"SLOW")+"_DPI";
    var list=nextFast?[5,6,8,12]:[4,3,2,1];
    var gain=axis==="HORIZONTAL"?movement.horizontal:movement.vertical;
    var focus=dpiSelection[axis+"_"+(nextFast?"FAST":"SLOW")];
    if(focus===undefined)focus=Math.max(0,list.indexOf(gain));
    go(dest,focus);
    return emit("page",id);
   }
   if(id==="KEY_A"){
    var next=Object.assign({},movement);
    if(screen==="ROTATION")next.rotation=selection;
    else{
     var fastDpi=screen.includes("_FAST_");
     var values=fastDpi?[5,6,8,12]:[4,3,2,1];
     var key=screen.startsWith("HORIZONTAL")?"horizontal":"vertical";
     next[key]=values[selection];
    }
    return emit("apply-movement",id,{movement:next});
   }
  }
  if(screen==="EDIT_CUSTOM"&&id==="JOY_PRESS"){
   customSource=selection;go(SOURCE[selection]+"_WILL_BECOME",customTargets[selection]);
   return emit("access",id);
  }
  if(isWill(screen)&&id==="KEY_A"){
   var target=selection;
   // Only one physical mouse button may be a modifier. Replaced modifiers
   // restore their native identity (Forward/Backward are not interchanged).
   if(target===5)for(var i=0;i<customTargets.length;i++){
    if(i!==customSource&&customTargets[i]===5)customTargets[i]=i;
   }
   customTargets[customSource]=target;
   customDirty=activeProfile!=="CUSTOM"||customTargets.some(function(t,i){return t!==appliedTargets[i];});
   var source=customSource;
   go("EDIT_CUSTOM",source);
   return emit("draft-target",id);
  }
  if(screen==="EDIT_CUSTOM"&&id==="KEY_A")
   return emit("apply-custom",id,{targets:customTargets.slice()});
  if(screen==="SAVED_DEVICES"){
   if(id==="JOY_LEFT"||id==="JOY_RIGHT"){
    if(savedCount)savedPage=(savedPage+(id==="JOY_LEFT"?savedCount-1:1))%savedCount;
    return emit("page",id);
   }
   if(id==="JOY_PRESS"&&savedCount){removeTargetId=savedMice[savedPage]?savedMice[savedPage].id:null;go("REMOVE_THIS");return emit("access",id);}
  }
  if(screen==="REMOVE_THIS"&&id==="KEY_A")return removeTargetId?emit("remove-request",removeTargetId):emit("no-action",id);
  if(screen==="APPLY_PASSTHROUGH"&&id==="KEY_A")return emit("apply-passthrough",id);
  return emit("no-action",id);
 }
 function confirmApply(kind){
  if(kind==="custom")go("MOUSE_OPTIONS",1);
  else if(kind==="passthrough")go("PASSTHROUGH_APPLIED");
  else if(kind==="movement")go("MOVEMENT_OPTIONS");
  return emit("applied",null);
 }
 function cancelAll(){
  var had=held.size||armed!==null;held.clear();armed=null;
  return had?emit("cancel"):snapshot();
 }
 return Object.freeze({
  press:press,release:release,cancelAll:cancelAll,setScenario:setScenario,
  inspect:inspect,syncMice:syncMice,confirmApply:confirmApply,snapshot:snapshot,isHelp:help,optionCount:options
 });
}
window.RemappingBridgeHAT=Object.freeze({
 controls:C,scenarios:SCENARIOS,screens:S,
 templates:T,ids:source.ids,sourceBlob:source.firmwareBlob,createEngine:createEngine,
 isCombo:isCombo,isShortcut:isShortcut,isWill:isWill,isDpi:isDpi,optionCount:countFor
});
}());
