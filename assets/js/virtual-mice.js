/* WEB-05: deterministic, entirely LOCAL virtual mouse/BLE session.
 * This module never calls Web Bluetooth, Web USB, remote APIs, or real HID.
 * Persisted schema is validated before use. Pending attempts are ephemeral
 * and never survive reloads. All times are explicit integer logical ticks.
 */
(function(){
"use strict";
var KEY="remappingbridge.virtual-mice.v1",SCHEMA="remappingbridge-virtual-mice-v1",MAX=8,MAX_EVENTS=48,TIMEOUT=5;
function copy(x){return JSON.parse(JSON.stringify(x));}
function nameOf(s){
 if(typeof s!=="string")throw new TypeError("Mouse name must be text");
 var name=s.trim().replace(/\s+/g," ");
 if(!name||name.length>32||/[\x00-\x1f\x7f]/.test(name))throw new RangeError("Mouse name must be 1–32 printable characters");
 return name;
}
function defaults(){return {kind:"PASSTHROUGH",targets:[0,1,2,3,4],movement:{horizontal:4,vertical:4,rotation:0},shortcuts:Array(12).fill(0)};}
function newState(){return {schema:SCHEMA,seq:0,clock:0,mice:[],frontId:null,connectedId:null,events:[]};}
function isId(s){return typeof s==="string"&&/^mouse-[0-9]{4,9}$/.test(s);}
function validate(raw){
 if(!raw||typeof raw!=="object"||raw.schema!==SCHEMA||
  !Number.isSafeInteger(raw.seq)||raw.seq<0||!Number.isSafeInteger(raw.clock)||raw.clock<0||
  !Array.isArray(raw.mice)||raw.mice.length>MAX||!Array.isArray(raw.events)||raw.events.length>MAX_EVENTS)
  throw new Error("Invalid virtual-mouse schema");
 var seen=new Set(),names=new Set();
 for(var m of raw.mice){
  if(!m||!isId(m.id)||seen.has(m.id)||m.name!==nameOf(m.name)||
     names.has(m.name.toLowerCase())||!m.profile||
     !["PASSTHROUGH","CUSTOM"].includes(m.profile.kind)||
     !Array.isArray(m.profile.targets)||m.profile.targets.length!==5||
     !m.profile.targets.every(n=>Number.isInteger(n)&&n>=0&&n<=5)||
     !m.profile.movement||!Number.isInteger(m.profile.movement.horizontal)||
     !Number.isInteger(m.profile.movement.vertical)||!Number.isInteger(m.profile.movement.rotation)||
     m.profile.movement.horizontal<1||m.profile.movement.horizontal>12||
     m.profile.movement.vertical<1||m.profile.movement.vertical>12||
     m.profile.movement.rotation<0||m.profile.movement.rotation>3||
     !Array.isArray(m.profile.shortcuts)||m.profile.shortcuts.length!==12||
     !m.profile.shortcuts.every(n=>Number.isInteger(n)&&n>=0&&n<=30))
      throw new Error("Invalid saved mouse or profile");
  seen.add(m.id);names.add(m.name.toLowerCase());
 }
 for(var id of [raw.frontId,raw.connectedId])if(id!==null&&!seen.has(id))throw new Error("Dangling mouse reference");
 for(var e of raw.events)if(!e||typeof e.kind!=="string"||e.kind.length>40||
  typeof e.text!=="string"||e.text.length>160||!Number.isSafeInteger(e.at)||e.at<0||e.at>raw.clock)
  throw new Error("Invalid event history");
 return copy(raw);
}
function storageAdapter(store){
 if(store===null)return null;
 if(store!==undefined)return store;
 try{return window.localStorage||null;}catch(_){return null;}
}
function create(options){
 options=options||{};
 var store=storageAdapter(options.storage),listeners=[],data=newState(),pending=null,serial=0;
 var durable=!!store,recovered=false;
 function save(next){
  if(!durable)return false;
  try{store.setItem(KEY,JSON.stringify(next));return true;}catch(_){durable=false;return false;}
 }
 if(durable)try{
  var value=store.getItem(KEY);
  if(value!==null){
   if(value.length>32000)throw Error("Oversized saved state");
   data=validate(JSON.parse(value));recovered=true;
  }
 }catch(_){data=newState();durable=false;recovered=false;}
 function emit(kind,text){
  var item={kind:kind,text:text,at:data.clock};
  var next=copy(data);
  next.events.unshift(item);next.events=next.events.slice(0,MAX_EVENTS);
  var wasDurable=save(next);data=next;
  var event=Object.freeze({kind:kind,text:text,durable:wasDurable,state:snapshot()});
  listeners.forEach(fn=>fn(event));
  return event;
 }
 function snapshot(){
  return Object.freeze(Object.assign(copy(data),{pending:pending?copy(pending):null,durable:durable,
    recovered:recovered,storageKey:KEY,maxMice:MAX,timeoutTicks:TIMEOUT}));
 }
 function listen(fn){if(typeof fn!=="function")throw TypeError("Listener required");listeners.push(fn);
  return function(){listeners=listeners.filter(x=>x!==fn);};}
 function find(id){return data.mice.find(m=>m.id===id)||null;}
 function cancel(reason){
  if(!pending)return emit("no-pending","No pending virtual connection to cancel.");
  pending=null;serial++;
  return emit("canceled","Virtual connection canceled"+(reason?" ("+reason+").":"."));
 }
 function start(mode,name,id){
  if(pending){pending=null;serial++;}
  if(mode==="pair"){
   var cleaned=nameOf(name);
   if(findByName(cleaned))return emit("duplicate","A saved virtual mouse already has that name. No duplicate created.");
   if(data.mice.length>=MAX)return emit("full","The eight-device virtual storage is full.");
   name=cleaned;id=null;
  } else if(mode==="saved"){
   id=id||data.frontId||(data.mice[0]&&data.mice[0].id);
   if(!find(id))return emit("not-found","No saved virtual mouse is selected.");
   name=find(id).name;
  } else throw RangeError("Invalid virtual attempt");
  serial++;
  pending={token:serial,mode:mode,name:name,id:id,startedAt:data.clock,dueAt:data.clock+TIMEOUT};
  return emit("started",(mode==="pair"?"Pair New":"Saved-mouse search")+" started for "+name+".");
 }
 function findByName(name){return data.mice.find(m=>m.name.toLowerCase()===name.toLowerCase())||null;}
 function beginPair(name){return start("pair",name);}
 function beginSearch(id){return start("saved",null,id);}
 function advance(ticks){
  if(!Number.isSafeInteger(ticks)||ticks<1||ticks>1000)throw RangeError("Advance by 1–1000 ticks");
  data.clock+=ticks;
  if(pending&&data.clock>=pending.dueAt){pending=null;serial++;return emit("timeout","Virtual connection timed out; retry is available.");}
  return emit("tick","Advanced the deterministic virtual clock by "+ticks+" tick(s).");
 }
 function complete(ok,token){
  if(!pending||(token!==undefined&&token!==pending.token))
   return emit("stale","Ignored a stale or canceled virtual connection result.");
  var task=pending;pending=null;serial++;
  if(!ok)return emit("failed","Virtual "+(task.mode==="pair"?"pairing":"reconnection")+" failed. No bond was changed.");
  if(task.mode==="pair"){
   if(data.mice.length>=MAX)return emit("full","Virtual storage is full. No bond created.");
   var match=findByName(task.name);
   if(match)return emit("duplicate","Existing mouse preserved; no duplicate bond created.");
   data.seq++;
   var id="mouse-"+String(data.seq).padStart(4,"0");
   var entry={id:id,name:task.name,profile:defaults()};
   data.mice.push(entry);data.frontId=id;data.connectedId=id;
   return emit("paired","Virtual mouse "+task.name+" paired and connected.");
  }
  var item=find(task.id);
  if(!item)return emit("stale","The saved mouse was removed; result ignored.");
  data.connectedId=item.id;data.frontId=item.id;
  return emit("connected","Virtual mouse "+item.name+" reconnected.");
 }
 function disconnect(){
  if(!data.connectedId)return emit("no-connection","No virtual mouse is connected.");
  data.connectedId=null;
  return emit("disconnected","Virtual mouse disconnected. Saved bonds were preserved.");
 }
 function front(id){
  if(!find(id))return emit("not-found","Saved mouse not found.");
  data.frontId=id;
  return emit("front","Front saved mouse is now "+find(id).name+".");
 }
 function remove(id){
  if(!find(id))return emit("not-found","Cannot remove a nonexistent virtual mouse.");
  var name=find(id).name;
  data.mice=data.mice.filter(m=>m.id!==id);
  if(data.connectedId===id)data.connectedId=null;
  if(data.frontId===id)data.frontId=data.mice[0]?data.mice[0].id:null;
  if(pending&&pending.id===id){pending=null;serial++;}
  return emit("removed","Removed "+name+" and its complete saved profile and bond.");
 }
 function reboot(){
  pending=null;serial++;data.connectedId=null;
  return emit("reboot","Virtual device rebooted: saved mice preserved; connection cleared.");
 }
 function reset(){
  pending=null;serial++;data=newState();
  if(durable)try{store.removeItem(KEY);}catch(_){durable=false;}
  // After a reset, write a schema-valid empty state for consistent reload.
  return emit("reset","All virtual saved mice, bonds, profiles and history were cleared.");
 }
 return Object.freeze({
  key:KEY,schema:SCHEMA,maxMice:MAX,timeoutTicks:TIMEOUT,
  snapshot:snapshot,subscribe:listen,beginPair:beginPair,beginSearch:beginSearch,
  advance:advance,complete:complete,cancel:cancel,disconnect:disconnect,
  selectFront:front,remove:remove,reboot:reboot,reset:reset,validate:validate
 });
}
window.RemappingBridgeVirtualMice=Object.freeze({create:create,validate:validate,schema:SCHEMA,key:KEY,maxMice:MAX});
}());
