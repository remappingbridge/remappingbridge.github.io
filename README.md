# RemappingBridge — Web Simulator

This repository hosts the **English-only**, single-page static web simulator for [RemappingBridge](https://github.com/remappingbridge/remappingbridge), built for the Raspberry Pi Pico 2 W and Waveshare Pico-LCD-1.3.

## Current status

**WEB-01 and WEB-02 accepted. WEB-03 is a candidate for production-browser review.**

The simulator now renders a native **240×240 Canvas** using firmware-authentic **5×7 bitmap glyphs**, 9 rows, 21 columns, 2× glyph scaling, semantic RGB565 colors, and didactic/standard spacing. The fixed source is the firmware **v3.2.4 renderer**, byte-identical to v3.2.3. The foreground title magenta, yellow body, gray actions, white focus and cyan states remain unchanged.

### WEB-03: HAT input, Help and Lock

- Virtual joystick (Up/Down/Left/Right/Press), A/B/X/Y buttons, and keyboard shortcuts (**arrow keys**, **Enter**/**Space**, **A/B/X/Y**) are implemented with native browser events. Keyboard shortcuts do not intercept input, text areas, selects, buttons or editable fields, or override Ctrl/Alt/Meta combinations.
- A key/button activates on **release**, not press. Long holds and keyboard auto-repeat do not trigger duplicate actions. Pointer cancel, lost release, window blur and hidden-tab transitions safely cancel held input instead of triggering it.
- The initial **SEARCHING FIRST MOUSE** tutorial remains didactic: its HAT legends highlight while pressed, and **Y does not lock it**, matching the firmware's original rule.
- Three **explicit virtual contexts** help test the interaction architecture without simulated BLE state: **First mouse**, **Connected demo** and **Saved mouse search**. They show the source HOME and HELP text templates; the Connected demo title **DEMO MOUSE** is visibly fake, never evidence of a real Bluetooth connection.
- On HOME, arrow/joystick Up and Down wrap the focused option and draw the **MNT-13 `|` selection marker** in column zero. **X** opens the corresponding Help; **B** returns with the prior selection. On Help, only **B** returns and **Y** locks; other controls have no action. Searching Help returns to Retry on B; Retry **A** restarts the virtual search.
- **Y** locks the virtual display only on allowed screens, painting a completely black 240×240 Canvas. The first held-and-released control **unlocks, restores the relevant HOME, and is consumed**; it cannot open a menu or trigger another action. The scenario selectors are disabled while locked.
- **Full 45-screen navigation and real menu commands belong to WEB-04.** MENU/Movement, Saved Devices, Pair New, profile management and BLE persistence are **not implemented** here. JOY PRESS on an unfinished route displays an explicit "planned for WEB-04" message.

### Revised web-only magenta background

Following operator acceptance of WEB-02, **Gentle** is the default and is slightly more vivid, less gray: **`#300c39`**, replacing `#28142c`. For comparison, **Original** `#080008` and **Soft** `#190b1d` remain selectable on the same page. Only the dark-magenta *background* differs; firmware title/foreground colors, glyph geometry, and physical firmware are unchanged. The web preview does not offer brightness above 100%.

## Production-browser verification

Use **https://remappingbridge.github.io/** to test the actual site. Choose **Connected demo**; use joystick Up/Down, X for Help, B for Back and Y for Lock. To unlock, press and release any HAT control once. Choose **Saved mouse search** to test B → Retry and A → Retry Search.

Open **https://remappingbridge.github.io/tests/** to run the **80 browser-only regression checks**, including all WEB-02 color/geometry snapshots and WEB-03 input, Help, Lock, release and mouse-context tests. These tests run directly in Firefox/Chromium without npm, Node, a custom website Actions build, bundlers, third-party CDNs or a backend. Do not claim the live browser checks have passed without observing the displayed result. The GitHub Pages branch deploy must also report success after new changes.

## Files

```text
index.html                    One English-language public application page
.nojekyll                     GitHub Pages static files, no Jekyll transform
assets/css/app.css            Rounded responsive UI, visible keyboard focus
assets/js/lcd-renderer.js     240x240 firmware bitmap rasterizer and palette
assets/js/hat-interaction.js  Virtual press/release, Help, Lock state engine
assets/js/app.js              Keyboard/pointer/touch mapping and Canvas binding
tests/index.html              Browser-native test harness
tests/runner.js               80 Canvas/HAT/Help/Lock regression assertions
tests/fixtures/              Fixed per-pixel RGBA hashes and colors
README.md                     Project documentation
LICENSE                       GNU AGPLv3 preserved
```

## English-only policy and scope

All interface text, accessible labels, browser tests, documentation, captions and release descriptions in this site and [firmware repository](https://github.com/remappingbridge/remappingbridge) must remain **English**. Literal firmware LCD strings and stable identifiers are preserved, not translated. Neither a language selector nor conventional site navigation is added.

This site does **not** pair real Bluetooth devices, provide HID to the host, store physical mouse profiles, write firmware, perform flash operations or track users. The firmware source remains CC0 1.0; this site's original license is GNU AGPLv3. No firmware release or UF2 is created by this web gate.

Planning: [WEB-00–WEB-15](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme). Desktop reference: [mouse-ui](https://github.com/remappingbridge/mouse-ui). The full v3 UX transition matrix and virtual Bluetooth come in later gates.
