# RemappingBridge — Web Simulator

Single-page, **English-only** browser simulator of the [RemappingBridge firmware](https://github.com/remappingbridge/remappingbridge) on a Raspberry Pi Pico 2 W with Waveshare Pico-LCD-1.3 HAT. The website is static HTML, CSS and native JavaScript, without npm, bundler, external CDN, backend, or custom site build workflow.

**WEB-01, WEB-02 and WEB-03 accepted by the operator. WEB-04 is a production-browser candidate, not yet accepted.**

## Production simulator

**[Open the simulator](https://remappingbridge.github.io/)** · **[Run browser tests](https://remappingbridge.github.io/tests/)**

The physical-HAT-inspired arrangement is a **smaller LCD centered between a left-hand joystick and four A/B/X/Y buttons stacked vertically on the right**. The `LCD BACKGROUND` selector is gone, so the web LCD **always uses Gentle `#300c39`**. No change has been made to the magenta titles or other firmware foreground colors.

The virtual display is exactly **240×240 logical pixels**, with native 5×7 source bitmaps scaled 2×, 9 rows×21 columns, source-defined text positioning, the RGB565 semantic palette and the MNT-13 single pipe `|` marking the selected option. A two-line COMBINATIONS option places the pipe on its **second line**. CSS scales the 240×240 bitmap for the screen without changing the logical resolution.

### WEB-04: canonical firmware screens

The `assets/js/screens.js` catalog contains all **45 screen templates** taken directly from [firmware v3.2.4](https://github.com/remappingbridge/remappingbridge/releases/tag/v3.2.4), which has identical LCD/UX C source Git blobs to v3.2.3. Literal source strings longer than 21 columns are deliberately preserved in the catalog and clipped only when projected, just as firmware `blu2usb_ui_frame_set_text()` does.

The virtual HAT supports release-based keyboard/pointer input, contextual Help (X), Back (B), Lock (Y), focus navigation with Up/Down, and left/right paging through six COMBINATIONS pages, five SHORTCUTS pages and Movement DPI pages. The HOME choices route to REMAPPING OPTIONS, MOVEMENT OPTIONS, SAVED DEVICES and PAIR NEW MOUSE. Available templates include Custom/Will Become, Pair Retry/Help, Saved Devices/Remove, first-mouse tutorial and device-help screens.

Three explicit visual contexts—**First mouse**, **Connected demo** and **Saved mouse search**—make it possible to explore menus without a physical mouse or fake Bluetooth pairing. Connected demo deliberately uses the title `DEMO MOUSE`. For auditing every template, expand **Inspect all 45 firmware screens** under the demo-state controls; this inspector is hidden by default and does not imply a real device connection.

**Limitations:** WEB-04 is a visual/navigation simulator, **not an operational BLE/USB firmware emulator**. It does **not** pair Bluetooth mice, persist per-device profiles, apply remapping/movement/shortcut changes, remove real bonds, update firmware or emit HID. Commands requiring saved-state transactions return explicit preview-only feedback. Complete mock BLE/persistence is reserved for WEB-05; Movement and Custom behavior for WEB-06; Modifier Shortcut assignments and color predicates for WEB-07. It does not impersonate hardware, and no physical UF2 or firmware tag is modified.

## Validate in your production browser

Open **https://remappingbridge.github.io/** and select **Connected demo**. Press the HAT's joystick (or Enter/Space) to open Remapping Options. Use Up/Down to change the selected option and B to go back. In Remapping Options choose Modifier Shortcuts to navigate the six COMBINATIONS and five SHORTCUTS pages. Press X on HOME/Movement options to open Help and B to return; Y locks the LCD, and the first release of a key unlocks without executing another action.

The **[browser-only regression suite](https://remappingbridge.github.io/tests/)** checks the 45 templates and rasterizations, 240×240 geometry, all original font/color invariants, revised physical HAT input, Help/Lock and canonical routes. The test suite contains **90 assertions**, which passed in an isolated JavaScript DOM/Canvas smoke environment during implementation; the **actual production-browser result still requires operator observation**.

Keyboard mappings: arrows→joystick directions, Enter/Space→joystick press, A/B/X/Y→the matching keys. Global keyboard shortcuts are suppressed while an input, select, button or editable element has focus and while Control/Alt/Meta is held. Focus and pointer cancellation release held inputs safely.

## Repository layout

```text
index.html                    English-language single app
.nojekyll                     Static GitHub Pages branch deployment
assets/css/app.css            Physical-HAT layout and responsive styles
assets/js/screens.js          All 45 firmware source screen templates
assets/js/hat-interaction.js  HAT release-driven 45-screen route model
assets/js/ui-projector.js     Semantic rows, colors, focus and dynamic labels
assets/js/lcd-renderer.js     Physical 5x7 font and 240x240 RGBA Canvas
assets/js/app.js              Browser events, scenario controls and rendering
tests/index.html              Browser-only tests, no npm or build
tests/runner.js               90 screen/navigation/Canvas regression checks
tests/fixtures/              WEB-02/03 frozen pixel RGBA goldens
README.md                     Project documentation
LICENSE                       GNU AGPLv3, unchanged
```

## Source, language and license

Firmware tag: **v3.2.4**. Source `src/ux_model/ux_model.c` Git blob `132010179de09ea81f4543e9ca83def09c0a743f`; font/renderer blob `61c4fe3d547ba05c3e24de86518d807047b50a77`. These are the same as v3.2.3, because v3.2.4 changes only a keyboard Zoom In chord.

All public text in the web simulator and firmware repository, including README and GitHub Release descriptions, must remain in **English**. Source LCD strings and identifiers are not rewritten or translated. This site retains **GNU AGPLv3**; firmware source is under **CC0 1.0**. No telemetry or third-party assets are added.

Gated development and accepted evidence: [WEB-00–WEB-15](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme). Reference visual simulator: [mouse-ui](https://github.com/remappingbridge/mouse-ui).
