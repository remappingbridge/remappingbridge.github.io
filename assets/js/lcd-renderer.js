/* WEB-02 — ST7789 240x240 software LCD rasterizer, no dependencies.
 * Exact 5x7 font, geometric constants, RGB565 tones and layout are
 * ported from RemappingBridge v3.2.4 renderer.c (identical Git blob
 * 61c4fe3d547ba05c3e24de86518d807047b50a77 in v3.2.3).
 * Only DARK MAGENTA background may differ for the browser.
 * THIS FILE DOES NOT IMPLEMENT FIRMWARE NAVIGATION OR BLE/HID.
 */
(function () {
  "use strict";
  var G = Object.freeze({
    width:240, height:240, rows:9, columns:21, glyphScale:2,
    glyphWidth:10, glyphHeight:14, charAdvance:11, lineAdvance:27,
    textX:7, textY:8, titleBodyGap:17, bodyLineGap:12,
    hintTopGap:11, hintLineGap:12, hintBottomGap:12, learnLineGap:11
  });
  var TONE = Object.freeze({
    TITLE:0, STATIC:1, ACTIONABLE:2, EMPHASIZED:3, CURRENT:4, SELECTED_CURRENT:5
  });
  var RGB565 = Object.freeze({
    BLACK:0x0000, WHITE:0xffff, MAGENTA:0xf81f,
    CYAN:0x07ff, CYAN_FOCUSED:0xd7ff, OFF_WHITE_YELLOW:0xffb8,
    LIGHT_GRAY:0xc618, DARK_MAGENTA:0x0801
  });
  var PALETTE = Object.freeze({
    original: Object.freeze({label:"Original",hex:"#080008",description:"Exact firmware RGB565 background"}),
    soft: Object.freeze({label:"Soft",hex:"#190b1d",description:"Subtly brighter web-only magenta"}),
    gentle: Object.freeze({label:"Gentle",hex:"#300c39",description:"Vivid Gentle: more saturated magenta, less gray"})
  });
  var GLYPHS_ALPHA = [[14,17,17,31,17,17,17],[30,17,17,30,17,17,30],[15,16,16,16,16,16,15],[30,17,17,17,17,17,30],[31,16,16,30,16,16,31],[31,16,16,30,16,16,16],[15,16,16,23,17,17,15],[17,17,17,31,17,17,17],[31,4,4,4,4,4,31],[7,2,2,2,18,18,12],[17,18,20,24,20,18,17],[16,16,16,16,16,16,31],[17,27,21,21,17,17,17],[17,25,21,19,17,17,17],[14,17,17,17,17,17,14],[30,17,17,30,16,16,16],[14,17,17,17,21,18,13],[30,17,17,30,20,18,17],[15,16,16,14,1,1,30],[31,4,4,4,4,4,4],[17,17,17,17,17,17,14],[17,17,17,17,17,10,4],[17,17,17,21,21,21,10],[17,17,10,4,10,17,17],[17,17,10,4,4,4,4],[31,1,2,4,8,16,31]];
  var GLYPHS_DIGIT = [[14,17,19,21,25,17,14],[4,12,4,4,4,4,14],[14,17,1,2,4,8,31],[30,1,1,14,1,1,30],[2,6,10,18,31,2,2],[31,16,16,30,1,1,30],[14,16,16,30,17,17,14],[31,1,2,4,8,8,8],[14,17,17,14,17,17,14],[14,17,17,15,1,1,14]];
  var PHYSICAL_SOURCE = Object.freeze({
    tag:"v3.2.4",rendererBlob:"61c4fe3d547ba05c3e24de86518d807047b50a77",
    uiBaseline:"v3.2.3",font:"5x7",sourceLicense:"CC0-1.0"
  });
  function assertInt(v,min,max,name) {
    if (!Number.isInteger(v)||v<min||v>max) throw new RangeError(name);
    return v;
  }
  function rgb565To888(v) {
    assertInt(v,0,65535,"RGB565");
    var r=(v>>>11)&31, g=(v>>>5)&63, b=v&31;
    return [((r<<3)|(r>>>2)),((g<<2)|(g>>>4)),((b<<3)|(b>>>2))];
  }
  function parseHex(hex) {
    if(!/^#[0-9a-f]{6}$/i.test(hex)) throw new TypeError("Invalid RGB color");
    return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  }
  var FOREGROUND = Object.freeze([
    RGB565.MAGENTA,RGB565.OFF_WHITE_YELLOW,RGB565.LIGHT_GRAY,
    RGB565.WHITE,RGB565.CYAN,RGB565.CYAN_FOCUSED
  ].map(rgb565To888));
  function toneRgb(tone) { return FOREGROUND[assertInt(tone,0,5,"Tone")].slice(); }
  function glyphRow(ch,row) {
    if(typeof ch!=="string"||ch.length!==1||row<0||row>=7||!Number.isInteger(row)) return 0;
    var c=ch.charCodeAt(0);
    if(c>=65&&c<=90) return GLYPHS_ALPHA[c-65][row];
    if(c>=48&&c<=57) return GLYPHS_DIGIT[c-48][row];
    switch(ch) {
      case "-": return row===3?31:0;
      case "+": return row===3?31:row>=1&&row<=5?4:0;
      case ":": return row===2||row===5?4:0;
      case ".": return row===6?4:0;
      case "=": return row===2||row===4?31:0;
      case "\\": return row<=4?(1<<(4-row)):0;
      case "/": return row<=4?(1<<row):0;
      case ">": return [16,8,4,2,4,8,16][row];
      case "|": return 4;
      case "<": return [1,2,4,8,4,2,1][row];
      case "?": return [14,17,1,2,4,0,4][row];
      case "!": return row<5||row===6?4:0;
      case ",": return row===5?4:row===6?8:0;
      case "(": return [2,4,8,8,8,4,2][row];
      case ")": return [8,4,2,2,2,4,8][row];
      default: return 0;
    }
  }
  function newFrame(lines,options) {
    if(!Array.isArray(lines)||lines.length!==G.rows||lines.some(x=>typeof x!=="string")) throw new TypeError("Exactly nine text rows required");
    options=options||{};
    var hint=options.hintStartRow===undefined?G.rows:assertInt(options.hintStartRow,0,G.rows,"Hint row");
    var frame={
      learnBackground:!!options.learnBackground,
      didacticLayout:!!options.didacticLayout,
      hintStartRow:hint,
      cells:lines.map(function(str,row) {
        // The physical frame_set_text copies only the first 21 columns.
        // Retain leading spaces: they select semantic ACTIONABLE tones.
        return Array.from({length:G.columns},function(_,col) {
          return {character:str[col]||" ",tone:row===0?TONE.TITLE:TONE.ACTIONABLE};
        });
      })
    };
    return frame;
  }
  function setToneSpan(frame,row,col,length,tone) {
    assertInt(row,0,8,"Row");assertInt(col,0,20,"Column");assertInt(length,0,21-col,"Length");
    assertInt(tone,0,5,"Tone");
    for(var n=col;n<col+length;n++) frame.cells[row][n].tone=tone;
    return frame;
  }
  function previewFrame(lines,pressed) {
    var frame=newFrame(lines,{learnBackground:true,didacticLayout:true,hintStartRow:9});
    // Exact searching-first projection: title is magenta, rows 1/2 static yellow,
    // all other labels gray until a real HAT press changes the indicated span.
    for(var r=1;r<=2;r++) setToneSpan(frame,r,0,21,TONE.STATIC);
    var spans={
      JOY_UP:[[3,7,6]],JOY_LEFT:[[4,2,3],[5,2,4]],
      JOY_PRESS:[[4,9,3],[5,8,5]],JOY_RIGHT:[[4,16,3],[5,15,5]],
      JOY_DOWN:[[6,6,8]],KEY_A:[[7,1,5]],KEY_X:[[7,15,5]],
      KEY_B:[[8,1,5]],KEY_Y:[[8,15,5]]
    };
    if(pressed&&Object.prototype.hasOwnProperty.call(spans,pressed))
      spans[pressed].forEach(function(x){setToneSpan(frame,x[0],x[1],x[2],TONE.EMPHASIZED);});
    return frame;
  }
  function textY(frame,row) {
    assertInt(row,0,8,"Row");
    if(frame.didacticLayout) {
      if(row===0) return G.textY;
      return G.textY+G.glyphHeight+G.titleBodyGap+(row-1)*(G.glyphHeight+G.learnLineGap);
    }
    if(row===0||frame.hintStartRow===0||frame.hintStartRow>G.rows)
      return G.textY+row*G.lineAdvance;
    var separatorRow=frame.hintStartRow-1;
    if(row>0&&row<separatorRow)
      return G.textY+G.glyphHeight+G.titleBodyGap+(row-1)*(G.glyphHeight+G.bodyLineGap);
    if(row>=frame.hintStartRow)
      return G.height-G.hintBottomGap-G.glyphHeight-(G.rows-1-row)*(G.glyphHeight+G.hintLineGap);
    return G.textY+row*G.lineAdvance;
  }
  function separatorY(frame) {
    if(frame.learnBackground||frame.hintStartRow===0||frame.hintStartRow>=G.rows) return G.height;
    var first=G.height-G.hintBottomGap-G.glyphHeight-(G.rows-1-frame.hintStartRow)*(G.glyphHeight+G.hintLineGap);
    return first<=G.hintTopGap?0:first-G.hintTopGap;
  }
  function getBackdrop(choice) {
    if(!Object.prototype.hasOwnProperty.call(PALETTE,choice)) throw new RangeError("Unknown background");
    return parseHex(PALETTE[choice].hex);
  }
  function rasterize(frame,choice) {
    if(!frame||!Array.isArray(frame.cells)||frame.cells.length!==G.rows||
       frame.cells.some(row=>!Array.isArray(row)||row.length!==G.columns))
       throw new TypeError("Invalid LCD frame");
    var backdrop=getBackdrop(choice===undefined?"soft":choice);
    var black=rgb565To888(RGB565.BLACK),boundary=separatorY(frame);
    var rgba=new Uint8ClampedArray(G.width*G.height*4);
    function paint(x,y,color) {
      if(x<0||x>=G.width||y<0||y>=G.height) return;
      var i=(y*G.width+x)*4;
      rgba[i]=color[0];rgba[i+1]=color[1];rgba[i+2]=color[2];rgba[i+3]=255;
    }
    for(var y=0;y<G.height;y++) {
      var bg=(frame.learnBackground||y>=boundary)?backdrop:black;
      for(var x=0;x<G.width;x++) paint(x,y,bg);
    }
    for(var row=0;row<G.rows;row++) {
      var cellBg=(frame.learnBackground||row>=frame.hintStartRow)?backdrop:black;
      var top=textY(frame,row);
      for(var col=0;col<G.columns;col++) {
        var cell=frame.cells[row][col];
        if(!cell||typeof cell.character!=="string"||cell.character.length!==1)
          throw new TypeError("Invalid LCD cell");
        if(cell.character===" ") continue;
        var color=FOREGROUND[assertInt(cell.tone,0,5,"Tone")];
        var left=G.textX+col*G.charAdvance;
        for(var gy=0;gy<7;gy++) {
          var bits=glyphRow(cell.character,gy);
          for(var gx=0;gx<5;gx++) {
            var ink=(bits&(1<<(4-gx)))!==0;
            var value=ink?color:cellBg;
            for(var dy=0;dy<G.glyphScale;dy++)
              for(var dx=0;dx<G.glyphScale;dx++)
                paint(left+gx*G.glyphScale+dx,top+gy*G.glyphScale+dy,value);
          }
        }
      }
    }
    return rgba;
  }
  function render(canvas,frame,choice) {
    if(!canvas||canvas.width!==G.width||canvas.height!==G.height)
      throw new Error("LCD Canvas must be exactly 240x240 logical pixels");
    var ctx=canvas.getContext("2d",{alpha:false});
    if(!ctx) throw new Error("Canvas 2D is unavailable");
    ctx.imageSmoothingEnabled=false;
    var image=ctx.createImageData(G.width,G.height);
    image.data.set(rasterize(frame,choice));
    ctx.putImageData(image,0,0);
    return canvas;
  }
  window.RemappingBridgeLCD=Object.freeze({
    geometry:G, tones:TONE, rgb565:RGB565, backdrops:PALETTE, source:PHYSICAL_SOURCE,
    rgb565To888:rgb565To888, toneRgb:toneRgb, glyphRow:glyphRow,
    newFrame:newFrame, setToneSpan:setToneSpan, previewFrame:previewFrame,
    textY:textY, separatorY:separatorY, rasterize:rasterize, render:render
  });
}());
