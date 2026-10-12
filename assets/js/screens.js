/* WEB-04 — authoritative 45 templates from v3.2.4 firmware.
 * Source src/ux_model/ux_model.c, Git blob 132010179de09ea81f4543e9ca83def09c0a743f.
 * The C source has 2 long source strings in HELP_REMAPPER_OPTIONS (22 chars);
 * preserve those literals here and clip only when producing the physical
 * 21-column framebuffer, exactly as blu2usb_ui_frame_set_text() does.
 */
(function () {
  "use strict";
  var catalog={
  "HOME": {
    "rows": [
      "UNKNOWN MOUSE",
      " REMAPPING OPTIONS",
      " MOVEMENT OPTIONS",
      " SAVED DEVICES",
      " PAIR NEW MOUSE",
      "",
      "JOY UP / DOWN: SELECT",
      "JOY PRESS: ACCESS",
      "KEY X: HELP TO REMOVE"
    ],
    "dynamic": [
      0
    ]
  },
  "HELP_HOME_CONNECTED": {
    "rows": [
      "REMOVE CONNECTED HELP",
      "TO DISCONNECT THE",
      "CURRENTLY CONNECTED",
      "MOUSE NAVIGATE TO:",
      "STEP 1. SAVED DEVICES",
      "STEP 2. REMOVE DEVICE",
      "STEP 3. KEY A: REMOVE",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "HOME_SEARCHING": {
    "rows": [
      "SEARCHING SAVED MOUSE",
      " SAVED DEVICES",
      " PAIR NEW MOUSE",
      "",
      "",
      "KEY B: CANCEL SEARCH",
      "JOY UP / DOWN: SELECT",
      "JOY PRESS: ACCESS",
      "KEY X: HELP"
    ],
    "dynamic": []
  },
  "HOME_SEARCHING_HELP": {
    "rows": [
      "HOME SEARCHING HELP",
      "THE MATCHING ATTEMPT",
      "TOOK PLACE ONLY FOR",
      "DEVICES ALREADY SAVED",
      "IN THE PREFERENCES,",
      "BUT NOT FOR DEVICES",
      "THAT WERE NOT SAVED.",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "HOME_RETRY": {
    "rows": [
      "DEVICE NOT FOUND",
      " SAVED DEVICES",
      " PAIR NEW MOUSE",
      "",
      "",
      "KEY A: RETRY SEARCH",
      "JOY UP / DOWN: SELECT",
      "JOY PRESS: ACCESS",
      "KEY X: HELP"
    ],
    "dynamic": []
  },
  "HOME_RETRY_HELP": {
    "rows": [
      "HOME RETRY HELP",
      "THE MATCHING ATTEMPT",
      "TOOK PLACE ONLY FOR",
      "DEVICES ALREADY SAVED",
      "IN THE PREFERENCES,",
      "BUT NOT FOR DEVICES",
      "THAT WERE NOT SAVED.",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "MOUSE_OPTIONS": {
    "rows": [
      "REMAPPING OPTIONS",
      " PASSTHROUGH DEFAULT",
      " CUSTOM REMAPPING",
      " MODIFIER SHORTCUTS",
      "",
      "JOY UP/DOWN: SELECT",
      "JOY PRESS: ACCESS",
      "KEY B: BACK",
      "KEY X: HELP"
    ],
    "dynamic": []
  },
  "HELP_REMAPPER_OPTIONS": {
    "rows": [
      "REMAPPING OPTIONS HELP",
      "PASSTHROUGH DEFAULT",
      "KEEPS ORIGINAL BUTTONS",
      "CUSTOM REMAPPING",
      "EDITS MOUSE BUTTONS",
      "MODIFIER SHORTCUTS",
      "CONFIGURES SHORTCUTS",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "PAIR_MOUSE": {
    "rows": [
      "PAIR NEW MOUSE",
      "TRYING TO CONNECT",
      "A NEW MOUSE THAT",
      "IS NOT LISTED",
      "IN SAVED DEVICES",
      "",
      "KEY B: CANCEL",
      "KEY X: HELP",
      "KEY Y: LOCK"
    ],
    "dynamic": []
  },
  "HELP_PAIR_NEW": {
    "rows": [
      "PAIR NEW DEVICE HELP",
      "TO CONNECT A SAVED",
      "DEVICE FIRST UNPLUG",
      "CURRENTLY CONNECTED",
      "MOUSE AND PRESS THE",
      "KEY B TO BACK UNTIL",
      "SEARCHING APPEARS.",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "RETRY_PAIR_NEW": {
    "rows": [
      "NEW MOUSE NOT FOUND",
      "NO NEW MOUSE OUTSIDE",
      "THE LIST OF SAVED",
      "DEVICES WAS FOUND",
      "",
      "KEY A: RETRY NEW PAIR",
      "KEY B: BACK TRY SAVED",
      "KEY X: HELP",
      "KEY Y: LOCK"
    ],
    "dynamic": []
  },
  "HELP_RETRY_PAIR_NEW": {
    "rows": [
      "MOUSE NOT FOUND HELP",
      "TO CONNECT A SAVED",
      "DEVICE FIRST UNPLUG",
      "CURRENTLY CONNECTED",
      "MOUSE AND PRESS THE",
      "KEY B TO BACK UNTIL",
      "SEARCHING APPEARS.",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "MOUSE_SAVED": {
    "rows": [
      "FIRST MOUSE CONNECTED",
      "       JOY UP",
      "  JOY    JOY    JOY",
      "  LEFT  PRESS  RIGHT",
      "      JOY DOWN",
      " KEY A         KEY X",
      " KEY B         KEY Y",
      "",
      "KEY Y: LOCKS ANYWHERE"
    ],
    "dynamic": []
  },
  "APPLY_PASSTHROUGH": {
    "rows": [
      "APPLY PASSTHROUGH",
      "ORIGINAL MOUSE",
      "BUTTONS POSITION",
      "ARE NOT ACTIVE",
      "",
      "",
      "KEY A: APPLY",
      "KEY B: CANCEL",
      "KEY Y: LOCK"
    ],
    "dynamic": []
  },
  "PASSTHROUGH_APPLIED": {
    "rows": [
      "PASSTHROUGH ACTIVE",
      "ORIGINAL MOUSE",
      "BUTTONS POSITION",
      "ARE ACTIVE NOW",
      "",
      "",
      "",
      "KEY B: BACK",
      "KEY Y: LOCK"
    ],
    "dynamic": []
  },
  "EDIT_CUSTOM": {
    "rows": [
      "EDIT CUSTOM REMAP",
      " LEFT IS LEFT",
      " RIGHT IS RIGHT",
      " MIDDLE IS MIDDLE",
      " FORWARD IS FORWARD",
      " BACKWARD IS BACKWARD",
      "",
      "JOY PRESS: ACCESS",
      "KEY A: APPLY CUSTOM"
    ],
    "dynamic": [
      1,
      2,
      3,
      4,
      5
    ]
  },
  "LEFT_WILL_BECOME": {
    "rows": [
      "LEFT WILL BECOME",
      " LEFT",
      " RIGHT",
      " MIDDLE",
      " FORWARD",
      " BACKWARD",
      " MODIFIER",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "RIGHT_WILL_BECOME": {
    "rows": [
      "RIGHT WILL BECOME",
      " LEFT",
      " RIGHT",
      " MIDDLE",
      " FORWARD",
      " BACKWARD",
      " MODIFIER",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "MIDDLE_WILL_BECOME": {
    "rows": [
      "MIDDLE WILL BECOME",
      " LEFT",
      " RIGHT",
      " MIDDLE",
      " FORWARD",
      " BACKWARD",
      " MODIFIER",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "FORWARD_WILL_BECOME": {
    "rows": [
      "FORWARD WILL BECOME",
      " LEFT",
      " RIGHT",
      " MIDDLE",
      " FORWARD",
      " BACKWARD",
      " MODIFIER",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "BACKWARD_WILL_BECOME": {
    "rows": [
      "BACKWARD WILL BECOME",
      " LEFT",
      " RIGHT",
      " MIDDLE",
      " FORWARD",
      " BACKWARD",
      " MODIFIER",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "SAVED_DEVICES": {
    "rows": [
      "0 OF 0",
      "UNKNOWN MOUSE",
      "PROFILE: PASSTHROUGH",
      "DPI: H 1 - V 1",
      "ROTATION: 0 DEGREE",
      " REMOVE DEVICE",
      "",
      "JOY RIGHT/LEFT: PAGE",
      "JOY PRESS: ACCESS"
    ],
    "dynamic": [
      0,
      1,
      2,
      3,
      4
    ]
  },
  "REMOVE_THIS": {
    "rows": [
      "REMOVE THIS MOUSE",
      "UNKNOWN MOUSE",
      "SAVED PAIRING AND",
      "PREFERENCES WILL",
      "BE DELETED.",
      "",
      "KEY A: REMOVE",
      "KEY B: CANCEL",
      "KEY X: HELP"
    ],
    "dynamic": [
      1
    ]
  },
  "HELP_REMOVE_THIS": {
    "rows": [
      "REMOVE MOUSE HELP",
      "COMPLETELY REMOVE THE",
      "AUTOMATIC CONNECTION",
      "WHEN TURNING ON THE",
      "DEVICE AND DELETE ITS",
      "BUTTON REMAPPING AND",
      "CUSTOM MOVEMENTS",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "MOVEMENT_OPTIONS": {
    "rows": [
      "MOVEMENT OPTIONS",
      " HORIZONTAL DPI 1",
      " VERTICAL DPI 1",
      " COUNTERCLOCKWISE",
      " ROTATION 0-DEGREE",
      "",
      "JOY PRESS: ACCESS",
      "KEY A: RESET ALL",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "HORIZONTAL_SLOW_DPI": {
    "rows": [
      "HORIZONTAL SLOW DPI",
      " NORMAL        1x",
      " SLIGHTLY SLOW 0.75x",
      " SLOW          0.5x",
      " VERY SLOW     0.25x",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "KEY A: APPLY AND BACK",
      "KEY X: HELP SLOW DPI"
    ],
    "dynamic": []
  },
  "HORIZONTAL_FAST_DPI": {
    "rows": [
      "HORIZONTAL FAST DPI",
      " SLIGHTLY FAST  1.25x",
      " FAST           1.5x",
      " VERY FAST      2x",
      " EXTREMELY FAST 3x",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "KEY A: APPLY AND BACK",
      "KEY X: HELP FAST DPI"
    ],
    "dynamic": []
  },
  "VERTICAL_SLOW_DPI": {
    "rows": [
      "VERTICAL SLOW DPI",
      " NORMAL        1x",
      " SLIGHTLY SLOW 0.75x",
      " SLOW          0.5x",
      " VERY SLOW     0.25x",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "KEY A: APPLY AND BACK",
      "KEY X: HELP SLOW DPI"
    ],
    "dynamic": []
  },
  "VERTICAL_FAST_DPI": {
    "rows": [
      "VERTICAL FAST DPI",
      " SLIGHTLY FAST  1.25x",
      " FAST           1.5x",
      " VERY FAST      2x",
      " EXTREMELY FAST 3x",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "KEY A: APPLY AND BACK",
      "KEY X: HELP FAST DPI"
    ],
    "dynamic": []
  },
  "ROTATION": {
    "rows": [
      "ROTATION",
      " 0-DEGREE",
      " 90-DEGREE",
      " 180-DEGREE",
      " 270-DEGREE",
      "",
      "KEY A: APPLY AND BACK",
      "KEY B: CANCEL",
      "KEY X: HELP"
    ],
    "dynamic": []
  },
  "HELP_SLOW_DPI": {
    "rows": [
      "SLOW DPI HELP",
      "SLOWER DPI POINTER",
      "ARE RECOMMENDED",
      "FOR MOVEMENTS THAT",
      "REQUIRE GREATER",
      "SENSITIVITY AND",
      "PRECISION",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "HELP_FAST_DPI": {
    "rows": [
      "FAST DPI HELP",
      "FASTER DPI POINTER",
      "IS RECOMMENDED FOR",
      "HIGH-RESOLUTION",
      "DESKTOP AND",
      "WIDESCREEN",
      "ENVIRONMENTS",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "HELP_ROTATION": {
    "rows": [
      "ROTATION HELP",
      "MOUSE MOVEMENT",
      "CHANGES DIRECTION",
      "EVERY 90 DEGREES",
      "FROM THE PREVIOUS",
      "DIRECTION",
      "ANTICLOCKWISE",
      "",
      "KEY B: BACK"
    ],
    "dynamic": []
  },
  "COMBINATIONS_1": {
    "rows": [
      "COMBINATIONS 1 OF 6",
      " MODIFIER RELEASED IS",
      " NOT CUSTOMIZED",
      " MOD + MIDDLE IS",
      " NOT CUSTOMIZED",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "JOY PRESS: ACCESS",
      "KEY A: RESET SELECTED"
    ],
    "dynamic": [
      2,
      4
    ]
  },
  "COMBINATIONS_2": {
    "rows": [
      "COMBINATIONS 2 OF 6",
      " MOD + LEFT CLICK IS",
      " NOT CUSTOMIZED",
      " MOD + RIGHT CLICK IS",
      " NOT CUSTOMIZED",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "JOY PRESS: ACCESS",
      "KEY A: RESET SELECTED"
    ],
    "dynamic": [
      2,
      4
    ]
  },
  "COMBINATIONS_3": {
    "rows": [
      "COMBINATIONS 3 OF 6",
      " MOD + FORWARD IS",
      " NOT CUSTOMIZED",
      " MOD + BACKWARD IS",
      " NOT CUSTOMIZED",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "JOY PRESS: ACCESS",
      "KEY A: RESET SELECTED"
    ],
    "dynamic": [
      2,
      4
    ]
  },
  "COMBINATIONS_4": {
    "rows": [
      "COMBINATIONS 4 OF 6",
      " MOD + WHEEL UP IS",
      " NOT CUSTOMIZED",
      " MOD + WHEEL DOWN IS",
      " NOT CUSTOMIZED",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "JOY PRESS: ACCESS",
      "KEY A: RESET SELECTED"
    ],
    "dynamic": [
      2,
      4
    ]
  },
  "COMBINATIONS_5": {
    "rows": [
      "COMBINATIONS 5 OF 6",
      " MOD + MOVE LEFT IS",
      " NOT CUSTOMIZED",
      " MOD + MOVE RIGHT IS",
      " NOT CUSTOMIZED",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "JOY PRESS: ACCESS",
      "KEY A: RESET SELECTED"
    ],
    "dynamic": [
      2,
      4
    ]
  },
  "COMBINATIONS_6": {
    "rows": [
      "COMBINATIONS 6 OF 6",
      " MOD + MOVE UP IS",
      " NOT CUSTOMIZED",
      " MOD + MOVE DOWN IS",
      " NOT CUSTOMIZED",
      "",
      "JOY LEFT/RIGHT: PAGE",
      "JOY PRESS: ACCESS",
      "KEY A: RESET SELECTED"
    ],
    "dynamic": [
      2,
      4
    ]
  },
  "SHORTCUTS_1": {
    "rows": [
      "SHORTCUTS 1-6 OF 30",
      " COPY",
      " CUT",
      " SELECT ALL",
      " PASTE",
      " UNDO",
      " REDO",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "SHORTCUTS_2": {
    "rows": [
      "SHORTCUTS 7-12 OF 30",
      " ESCAPE",
      " SPACE",
      " ENTER/RETURN",
      " BACKSPACE",
      " DELETE",
      " RENAME",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "SHORTCUTS_3": {
    "rows": [
      "SHORTCUTS 13-18 OF 30",
      " FULL SCREEN",
      " SCREENSHOT FULL",
      " SCREENSHOT AREA",
      " REFRESH",
      " FIND",
      " SAVE",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "SHORTCUTS_4": {
    "rows": [
      "SHORTCUTS 19-24 OF 30",
      " PLAY/PAUSE",
      " NEXT TRACK",
      " PREVIOUS TRACK",
      " VOLUME UP",
      " VOLUME DOWN",
      " MUTE",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "SHORTCUTS_5": {
    "rows": [
      "SHORTCUTS 25-30 OF 30",
      " HOME SCREEN/PAGE",
      " ZOOM IN",
      " ZOOM OUT",
      " RESET ZOOM",
      " BRIGHTNESS UP",
      " BRIGHTNESS DOWN",
      "",
      "KEY A: APPLY AND BACK"
    ],
    "dynamic": []
  },
  "SEARCHING_FIRST": {
    "rows": [
      "SEARCHING FIRST MOUSE",
      "PRESS TO LEARN KEYS",
      "WHILE WAIT CONNECTION",
      "       JOY UP",
      "  JOY    JOY    JOY",
      "  LEFT  PRESS  RIGHT",
      "      JOY DOWN",
      " KEY A         KEY X",
      " KEY B         KEY Y"
    ],
    "dynamic": []
  }
};
  Object.keys(catalog).forEach(function(id) {
    var entry=catalog[id];
    if(entry.rows.length!==9||entry.rows.some(function(x){return typeof x!=="string";}))
      throw new Error("Invalid canonical screen: "+id);
    Object.freeze(entry.rows);Object.freeze(entry.dynamic);Object.freeze(entry);
  });
  window.RemappingBridgeScreens=Object.freeze({
    firmwareTag:"v3.2.4",
    firmwareBlob:"132010179de09ea81f4543e9ca83def09c0a743f",
    ids:Object.freeze(Object.keys(catalog)),
    templates:Object.freeze(catalog),
    get:function(id){return catalog[id]||null;}
  });
}());
