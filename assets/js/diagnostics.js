/* WEB-09 — local diagnostic scenario snapshots, 240x240 semantic hit testing
 * and deterministic evidence. These scenarios NEVER open browser storage,
 * Web Bluetooth, USB/HID, network APIs or change the live virtual mouse.
 */
(function(){
"use strict";
var SCENARIOS=Object.freeze([
 {id:"first-use",label:"First use · no saved mice"},
 {id:"connected",label:"Connected saved virtual mouse"},
 {id:"multi-mouse",label:"Two independent saved mice"},
 {id:"remove-device",label:"Remove a saved mouse"},
 {id:"stale-fail",label:"Stale response and failed pairing"},
 {id:"timeout",label:"Saved mouse search timeout"},
 {id:"movement-custom",label:"Custom profile and Movement"},
 {id:"shortcuts",label:"Modifier shortcuts and assignments"}
]);
function checksum(value){
 var str=typeof value==="string"?value:JSON.stringify(value),h=2166136261;
 for(var i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619)>>>0;
 return h.toString(16).padStart(8,"0");
}
function create(deps){
 if(!deps||!deps.lcd||!deps.hat||!deps.projector||!deps.virtual)
  throw TypeError("A canonical LCD, HAT, projector and virtual model are required");
 var lcd=deps.lcd,hat=deps.hat,projector=deps.projector,virtual=deps.virtual;
 var last=null,selected=null,history=[];
 function record(source,kind,detail){
  var entry={index:history.length?history[history.length-1].index+1:1,
    source:String(source).slice(0,32),kind:String(kind).slice(0,48),
    detail:String(detail||"").slice(0,180)};
  history.push(entry);
  if(history.length>60)history.shift();
  return entry;
 }
 function run(id){
  var def=SCENARIOS.find(function(x){return x.id===id;});
  if(!def)throw RangeError("Unknown diagnostic scenario");
  // null is an explicit in-memory virtual storage adapter, not localStorage.
  var model=virtual.create({storage:null}),log=[];
  model.subscribe(function(e){log.push({kind:e.kind,text:e.text,at:e.state.clock});});
  var engine=hat.createEngine();
  function sync(reason){engine.syncMice(model.snapshot(),reason);}
  function pair(name){model.beginPair(name);model.complete(true);sync("connected");return model.snapshot().connectedId;}
  sync("initialized");
  if(id==="connected"){pair("Demo Connected");}
  else if(id==="multi-mouse"){pair("Demo Alpha");pair("Demo Beta");}
  else if(id==="remove-device"){
   var first=pair("Demo Alpha");pair("Demo Beta");
   model.remove(first);sync("removed");engine.inspect("SAVED_DEVICES");
  } else if(id==="stale-fail"){
   var start=model.beginPair("Demo Stale");
   var token=start.state.pending.token;
   model.cancel("diagnostic");
   model.complete(true,token); // Must stay stale and create no bond
   model.beginPair("Demo Failed");model.complete(false);sync("failed-pair");
  } else if(id==="timeout"){
   var saved=pair("Demo Timeout");
   model.disconnect();sync("disconnected");
   model.beginSearch(saved);sync("started-saved");
   model.advance(model.timeoutTicks);sync("timeout-saved");
  } else if(id==="movement-custom"){
   var moved=pair("Demo Movement"),p=model.profileFor(moved);
   p.kind="CUSTOM";p.targets=[5,1,2,3,4];
   p.movement={horizontal:8,vertical:3,rotation:1};
   model.applyProfile(moved,p);sync("profile-applied");engine.inspect("MOVEMENT_OPTIONS");
  } else if(id==="shortcuts"){
   var id0=pair("Demo Shortcuts"),p0=model.profileFor(id0);
   p0.kind="CUSTOM";p0.targets=[5,1,2,3,4];
   p0.shortcuts[0]=26;p0.shortcuts[1]=1;p0.shortcuts[5]=30;
   model.applyProfile(id0,p0);sync("profile-applied");engine.inspect("COMBINATIONS_1");
  }
  var state=engine.snapshot(),vm=model.snapshot();
  var frame=projector.frame(state,lcd);
  var sample={scenario:id,screen:state.screen,selection:state.selection,
    locked:state.locked,profile:state.activeProfile,
    modifier:state.modifierSource,movement:state.movement,shortcuts:state.shortcuts,
    clock:vm.clock,saved:vm.mice.map(function(m){return {id:m.id,name:m.name,profile:m.profile};}),
    frontId:vm.frontId,connectedId:vm.connectedId,
    events:log,rows:frame.cells.map(function(row){return row.map(function(c){return c.character;}).join("");})};
  var hash=checksum(sample);
  last={id:id,label:def.label,screen:state.screen,hash:hash,source:"v3.2.4",
    geometry:{width:240,height:240,rows:9,columns:21},
    state:state,virtual:{savedCount:vm.mice.length,connectedId:vm.connectedId,
      frontId:vm.frontId,pending:vm.pending,durable:vm.durable},
    events:log,frame:frame,deterministic:sample};
  selected=null;
  record("scenario","run",id+" | screen "+state.screen+" | "+hash);
  return snapshot();
 }
 function snapshot(){
  if(!last)return null;
  return {id:last.id,label:last.label,screen:last.screen,hash:last.hash,
    geometry:last.geometry,state:last.state,virtual:last.virtual,
    events:last.events.slice(),selection:selected,
    timeline:history.slice()};
 }
 function frame(){return last?last.frame:null;}
 function inspectPixel(x,y){
  if(!last)throw Error("Run a scenario before inspecting");
  x=Math.floor(Number(x));y=Math.floor(Number(y));
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=240||y>=240){
   selected=null;return null;
  }
  var col=Math.floor((x-lcd.geometry.textX)/lcd.geometry.charAdvance);
  if(col<0||col>=21){selected=null;return null;}
  for(var row=0;row<9;row++){
   var top=lcd.textY(last.frame,row);
   if(y<top||y>=top+lcd.geometry.glyphHeight)continue;
   var cell=last.frame.cells[row][col];
   if(!cell||cell.character===" "){selected=null;return null;}
   selected={id:"LCD/"+last.screen+"/ROW_"+String(row+1).padStart(2,"0")+
      "/COL_"+String(col+1).padStart(2,"0"),
    screen:last.screen,row:row,column:col,character:cell.character,
    tone:cell.tone,bounds:{x:lcd.geometry.textX+col*lcd.geometry.charAdvance,
      y:top,width:lcd.geometry.glyphWidth,height:lcd.geometry.glyphHeight},
    pixel:{x:x,y:y}};
   record("inspector","select",selected.id);
   return selected;
  }
  selected=null;return null;
 }
 function toJSON(){
  return JSON.stringify({
   schema:"remappingbridge-web-diagnostics-v1",firmware:"v3.2.4",
   note:"Local browser-only simulation; not physical device evidence.",
   scenario:last?{id:last.id,label:last.label,hash:last.hash,screen:last.screen,
     geometry:last.geometry,deterministic:last.deterministic,
     selected:selected}:null,
   timeline:history.slice()
  },null,2)+"\n";
 }
 function toText(){
  var s=last;
  var lines=["REMAPPINGBRIDGE WEB-09 LOCAL DIAGNOSTICS","Firmware: v3.2.4",
    "No real mouse or hardware was used.",""];
  if(s){
   lines.push("Scenario: "+s.id,"Screen: "+s.screen,"Deterministic hash: "+s.hash,
      "Logical canvas: 240 x 240", "Saved virtual mice: "+s.virtual.savedCount);
   if(selected)lines.push("Selected element: "+selected.id,
       "Bounds: "+JSON.stringify(selected.bounds));
   lines.push("","SCENARIO EVENTS:");
   s.events.forEach(function(e){lines.push("Tick "+e.at+": "+e.kind+" | "+e.text);});
  }else lines.push("Scenario not run");
  lines.push("","TIMELINE:");
  history.forEach(function(e){lines.push("#"+e.index+" "+e.source+" | "+e.kind+" | "+e.detail);});
  return lines.join("\n")+"\n";
 }
 return Object.freeze({scenarios:SCENARIOS,run:run,snapshot:snapshot,frame:frame,
  inspectPixel:inspectPixel,record:record,toJSON:toJSON,toText:toText});
}
window.RemappingBridgeDiagnostics=Object.freeze({
 create:create,scenarios:SCENARIOS,checksum:checksum,
 schema:"remappingbridge-web-diagnostics-v1"
});
}());
