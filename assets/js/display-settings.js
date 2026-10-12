/* WEB-08 — browser-only display preferences. Never touches firmware, backlight,
 * Web Bluetooth, USB/HID, or the canonical RGB565 frame buffer.
 * The 0..100% preference is separate from responsive CSS pixel scaling.
 */
(function(){
"use strict";
var KEY="remappingbridge.display.v1",SCHEMA="remappingbridge-display-v1";
var DENSITIES=Object.freeze(["compact","standard","spacious"]);
function clamp(value){
 var n=Number(value);
 return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):100;
}
function valid(v){return !!v&&typeof v==="object"&&v.schema===SCHEMA&&
 Number.isInteger(v.brightness)&&v.brightness>=0&&v.brightness<=100&&
 DENSITIES.includes(v.density);}
function fresh(){return {schema:SCHEMA,brightness:100,density:"standard"};}
function create(options){
 options=options||{};
 var store=null,enabled=false,recovered=false;
 if(options.storage!==undefined)store=options.storage;
 else try{store=window.localStorage||null;}catch(_){store=null;}
 enabled=!!store;
 var value=fresh(),listeners=[];
 if(enabled)try{
  var raw=store.getItem(KEY);
  if(raw!==null){
   if(raw.length>512)throw Error("Oversized display preferences");
   var parsed=JSON.parse(raw);
   if(!valid(parsed))throw Error("Invalid display preferences");
   value={schema:SCHEMA,brightness:parsed.brightness,density:parsed.density};
   recovered=true;
  }
 }catch(_){enabled=false;value=fresh();}
 function snapshot(locked){
  return Object.freeze({
   schema:SCHEMA,brightness:value.brightness,
   effectiveBrightness:locked?0:value.brightness,
   factor:(locked?0:value.brightness)/100,
   density:value.density,durable:enabled,recovered:recovered,key:KEY
  });
 }
 function emit(){
  if(enabled)try{store.setItem(KEY,JSON.stringify(value));}
  catch(_){enabled=false;}
  var s=snapshot(false);listeners.slice().forEach(function(fn){fn(s);});
  return s;
 }
 function setBrightness(v){value.brightness=clamp(v);return emit();}
 function setDensity(v){
  if(!DENSITIES.includes(v))throw RangeError("Invalid display density");
  value.density=v;return emit();
 }
 function subscribe(fn){
  if(typeof fn!=="function")throw TypeError("Listener must be a function");
  listeners.push(fn);
  return function(){listeners=listeners.filter(function(x){return x!==fn;});};
 }
 return Object.freeze({snapshot:snapshot,setBrightness:setBrightness,
  setDensity:setDensity,subscribe:subscribe});
}
window.RemappingBridgeDisplay=Object.freeze({create:create,clamp:clamp,
 schema:SCHEMA,key:KEY,densities:DENSITIES});
}());
