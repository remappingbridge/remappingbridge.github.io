/* WEB-04 — visual projection from canonical firmware 9×21 templates.
 * Sequence: source rows -> dynamic (demo) fields -> semantic foreground
 * -> focused option -> MNT-13 pipe marker -> v3.2.4 Canvas.
 * Does not claim BLE, flash/persistent preference operations.
 */
(function(){
"use strict";
var catalog=window.RemappingBridgeScreens;
var U=window.RemappingBridgeHAT;
function copyRows(id){return catalog.get(id).rows.slice();}
function title(frame,row,tone,lcd){lcd.setToneSpan(frame,row,0,21,tone);}
function replace(frame,row,value,tone,lcd){
 var text=String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
 for(var col=0;col<21;col++){frame.cells[row][col].character=text[col]||" ";frame.cells[row][col].tone=tone;}
}
function firstHint(rows){
 for(var i=1;i<9;i++)if(/^(JOY |KEY |ANY KEY)/.test(rows[i]))return i;
 return 9;
}
function setCellRow(frame,row,tone,lcd){
 for(var col=0;col<21;col++)if(frame.cells[row][col].character!==" ")frame.cells[row][col].tone=tone;
}
function focusRow(frame,row,lcd){
 if(row<1||row>=9)return;
 for(var i=0;i<21;i++){
  var c=frame.cells[row][i];
  if(c.character===" ")continue;
  c.tone=c.tone===lcd.tones.CURRENT?lcd.tones.SELECTED_CURRENT:lcd.tones.EMPHASIZED;
 }
}
function selectedRow(state){
 var id=state.screen;
 if(U.isCombo(id))return 1+2*state.selection;
 if(id==="MOVEMENT_OPTIONS")return state.selection===2?4:1+state.selection;
 if(id==="SAVED_DEVICES")return state.savedCount?5:-1;
 return U.optionCount(id)?1+state.selection:-1;
}
function parseGain(q){return ({1:"0.25",2:"0.5",3:"0.75",4:"1",5:"1.25",6:"1.5",8:"2",12:"3"})[q]||"1";}
function projection(state,lcd){
 var id=state.screen,rows=copyRows(id),didactic=id==="SEARCHING_FIRST"||id==="MOUSE_SAVED";
 if(id==="SEARCHING_FIRST")return lcd.previewFrame(rows,state.held[0]||null);
 var hint=id==="MOUSE_SAVED"||id==="HELP_PAIR_NEW"||id==="HELP_RETRY_PAIR_NEW"?8:firstHint(rows);
 var frame=lcd.newFrame(rows,{hintStartRow:hint,didacticLayout:didactic});
 for(var r=1;r<9;r++){
  var defaultTone=didactic||r>=hint||rows[r].charAt(0)===" "?
    lcd.tones.ACTIONABLE:lcd.tones.STATIC;
  setCellRow(frame,r,defaultTone,lcd);
 }
 var regular=lcd.tones.STATIC,muted=lcd.tones.ACTIONABLE,now=lcd.tones.CURRENT;
 if(id==="HOME")replace(frame,0,state.connectedId?(state.connectedName||"DEMO MOUSE"):"DEMO MOUSE",lcd.tones.TITLE,lcd);
 if(id==="SAVED_DEVICES"){
  replace(frame,0,state.savedCount?(Math.min(state.savedPage+1,state.savedCount)+" OF "+state.savedCount):"0 OF 0",lcd.tones.TITLE,lcd);
  var shown=state.savedMice&&state.savedMice[state.savedPage];
  replace(frame,1,shown?shown.name:"UNKNOWN MOUSE",state.connectedId&&shown&&shown.id===state.connectedId?now:regular,lcd);
  replace(frame,2,"PROFILE: "+state.activeProfile,regular,lcd);
  replace(frame,3,"DPI: H "+parseGain(state.movement.horizontal)+" - V "+parseGain(state.movement.vertical),regular,lcd);
  replace(frame,4,"ROTATION: "+(90*state.movement.rotation)+" DEGREE",regular,lcd);
  replace(frame,5," REMOVE DEVICE",state.savedCount?lcd.tones.EMPHASIZED:muted,lcd);
  for(var hr=hint;hr<9;hr++)setCellRow(frame,hr,muted,lcd);
 }
 if(id==="REMOVE_THIS"){
  var remove=state.savedMice&&state.savedMice.find(function(m){return m.id===state.removeTargetId;});
  replace(frame,1,remove?remove.name:"DEMO MOUSE",regular,lcd);
 }
 if(id==="MOVEMENT_OPTIONS"){
  replace(frame,1," HORIZONTAL DPI "+parseGain(state.movement.horizontal),muted,lcd);
  replace(frame,2," VERTICAL DPI "+parseGain(state.movement.vertical),muted,lcd);
  replace(frame,4," ROTATION "+(90*state.movement.rotation)+"-DEGREE",muted,lcd);
  if(state.selection===2)focusRow(frame,3,lcd);
  var pos1=" HORIZONTAL DPI ".length;
  var pos2=" VERTICAL DPI ".length;
  lcd.setToneSpan(frame,1,pos1,Math.min(21-pos1,parseGain(state.movement.horizontal).length),now);
  lcd.setToneSpan(frame,2,pos2,Math.min(21-pos2,parseGain(state.movement.vertical).length),now);
  lcd.setToneSpan(frame,4,10,Math.min(11,rows[4].length-10),now);
 }
 if(id==="MOUSE_OPTIONS"){
  setCellRow(frame,1,muted,lcd);setCellRow(frame,2,muted,lcd);setCellRow(frame,3,muted,lcd);
  setCellRow(frame,state.activeProfile==="CUSTOM"?2:1,now,lcd);
  if(state.activeProfile==="CUSTOM"&&(state.appliedTargets||state.customTargets).indexOf(5)>=0)setCellRow(frame,3,now,lcd);
 }
 if(id==="EDIT_CUSTOM"){
  var labels=["LEFT","RIGHT","MIDDLE","FORWARD","BACKWARD","MODIFIER"];
  for(var c=0;c<5;c++){
   replace(frame,c+1," "+labels[c]+" IS "+labels[state.customTargets[c]],state.activeProfile==="CUSTOM"&&!state.customDirty?now:muted,lcd);
  }
 }
 if(U.isWill(id)){
  for(var w=1;w<=6;w++)setCellRow(frame,w,muted,lcd);
  setCellRow(frame,(state.appliedTargets||state.customTargets)[state.customSource]+1,now,lcd);
 }
 if(U.isCombo(id)){
  var page=Number(id.split("_")[1])-1;
  var applied=state.appliedTargets||state.customTargets||[0,1,2,3,4];
  var active=U.shortcutsActive(state.activeProfile,applied);
  for(var pair=0;pair<2;pair++){
   var index=page*2+pair,shortcut=state.shortcuts[index];
   var unavailable=U.comboUnavailable(index,applied);
   var name=unavailable?"UNAVAILABLE":U.shortcutNames[shortcut]||"NOT CUSTOMIZED";
   replace(frame,2+pair*2," "+name,
      unavailable?regular:(active&&shortcut?now:muted),lcd);
   setCellRow(frame,1+pair*2,muted,lcd);
  }
 }
 if(U.isShortcut(id)){
  var shortPage=Number(id.split("_")[1])-1;
  var assignedShortcut=state.shortcuts[state.editingCombination];
  for(var a=1;a<=6;a++){
    var absoluteId=shortPage*6+a;
    setCellRow(frame,a,absoluteId===assignedShortcut?now:muted,lcd);
  }
 }
 if(id==="PASSTHROUGH_APPLIED"){
  for(var sr=1;sr<hint;sr++)setCellRow(frame,sr,now,lcd);
 }
 // WEB-07 mirrors v3.2.4 C rendering order: dynamic value, applied cyan,
 // focus, disabled yellow, then MNT-13 pipe on the value/second row.
 var chosen=selectedRow(state);
 if(chosen>0&&chosen<hint&&id!=="SAVED_DEVICES"){
  focusRow(frame,chosen,lcd);
  if(U.isCombo(id))focusRow(frame,chosen+1,lcd);
 }
 if(U.isCombo(id)){
  // Disabled slot value always stays informational yellow, even focused.
  // Only the label and column-0 focus marker indicate selection.
  var modTargets=state.appliedTargets||state.customTargets||[0,1,2,3,4];
  for(var rowPair=0;rowPair<2;rowPair++){
   var absoluteCombo=(Number(id.split("_")[1])-1)*2+rowPair;
   if(U.comboUnavailable(absoluteCombo,modTargets))
    setCellRow(frame,2+2*rowPair,regular,lcd);
  }
 }
 if(U.isCombo(id)&&chosen>0&&chosen+1<hint){
  // Marker is on the SECOND line of each selected pair, not on label.
  chosen++;
 }
 if(id==="SAVED_DEVICES"&&state.savedCount)chosen=5;
 if(chosen>0&&chosen<hint&&frame.cells[chosen][0].character===" "&&
    frame.cells[chosen][1].character!==" "){
  frame.cells[chosen][0].character="|";
  frame.cells[chosen][0].tone=(U.isCombo(id)&&
    U.comboUnavailable((Number(id.split("_")[1])-1)*2+state.selection,
      state.appliedTargets||state.customTargets||[0,1,2,3,4]))?
      frame.cells[chosen-1][1].tone:frame.cells[chosen][1].tone;
 }
 // Only HAT hints on non-saved screens highlight temporarily.
 if(id!=="SAVED_DEVICES"&&state.held.length){
  var hold=state.held[0],needle=hold.replace("JOY_","JOY ").replace("KEY_","KEY ");
  for(var h=hint;h<9;h++)
   if(rows[h].includes(needle))setCellRow(frame,h,lcd.tones.EMPHASIZED,lcd);
 }
 return frame;
}
window.RemappingBridgeProjector=Object.freeze({
 frame:projection,firstHint:firstHint,selectedRow:selectedRow,
 canonicalCount:catalog.ids.length
});
}());
