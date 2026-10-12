# RemappingBridge — Web Simulator

An **English-only**, static, single-page browser simulator of the [RemappingBridge](https://github.com/remappingbridge/remappingbridge) Pico 2 W and Waveshare Pico-LCD-1.3 firmware.

**WEB-01–WEB-06 accepted by the operator. WEB-07 is the current production-browser candidate; operator acceptance is pending.**

## Production

[Open the simulator](https://remappingbridge.github.io/) · [Run browser-only tests](https://remappingbridge.github.io/tests/)

The site consists solely of HTML/CSS/native JavaScript. No npm, Node.js, bundler, external CDN, service worker, application backend, telemetry, hosted storage, Web Bluetooth or custom Pages build workflow is required.

## WEB-07: always-visible, physically compact HAT

The **physical-HAT-inspired simulator is sticky at the top of the viewport**. Scroll through the Virtual Mouse Lab, screen inspector and session options below while the HAT stays in view. It remains a normal document element, not a detached overlay; its viewport offset, rounded border and shadow remain visible.

The HAT now displays **REMAPPINGBRIDGE in the upper-left corner** and the **yellow-dot VIRTUAL DEVICE indicator in the lower-left corner**, inside its sticky housing. The hardware specifications remain in a separate right-hand column, vertically aligned to the square LCD. Narrow screens reserve small corner-label bands to avoid overlapping LCD pixels.\n\nThe device has four horizontally aligned regions: **left cross-shaped joystick → reduced 240×240 logical LCD → four narrower, less-rounded A/B/X/Y buttons in a vertical column → right-side Pico / virtual device / LCD metadata**. The previous large brand/header above the simulated HAT and informational footer below it have been moved into the **right column**, vertically bounded by the LCD square. The LCD housing uses narrow padding above/below. Responsive CSS preserves the arrangement at narrower widths, with compact metadata.

The renderer preserves the accepted physical 240×240 logical framebuffer, 9×21 text grid, 5×7 source glyphs, RGB565 foreground colors, MNT-13 `|` selection marker and Gentle-only dark-magenta backdrop `#300c39`. The smaller visual size affects CSS presentation only, not firmware pixel data.

The English general key guide remains **outside the firmware LCD**, below the sticky device:
- **KEY B — Go back or cancel on most screens (except Connected Home).**
- **KEY Y — Lock the display; press and release any HAT control to unlock and return Home.**

These directions have important exceptions on the didactic first-mouse tutorial and some Retry screens, noted in the UI.

## Accepted WEB-06: Custom profile and Movement editing

The Virtual Mouse Lab from WEB-05 still manages up to **eight** saved virtual mice with stable IDs, independent default profiles, simulated Pair/Search/Disconnect/Remove/Reboot/Timeout, and validated localStorage persistence with a clear memory-only fallback.

For an actual saved virtual mouse, navigate using the virtual HAT (or keyboard Arrow keys, Enter/Space, A/B/X/Y):
1. **Connected Home → Remapping Options → Custom Remapping → Edit Custom.** Choose a source mouse button (Left, Right, Middle, Forward or Backward) with joystick Up/Down and Press. In **WILL BECOME**, choose Left/Right/Middle/Forward/Backward/Modifier and press **A** to set a **local draft**, then press **A in EDIT CUSTOM** to apply that profile to the selected virtual mouse. Until final Apply, the stored profile is unchanged and uncommitted values do not get the firmware's Current/Cyan color. Pressing **B from EDIT CUSTOM discards unapplied target drafts**.
2. At most **one** mouse source can be Modifier at any time. Assigning a second one releases the previous Modifier back to its original identity; Forward and Backward remain distinct, not swapped. A completely applied Custom profile and applied Modifier control the Cyan/Current styling in Remapping Options.
3. **Remapping Options → Passthrough Default → Apply** switches the selected mouse back to Passthrough. The custom mapping remains stored in its profile for subsequent use; Passthrough must not turn Modifier Shortcuts cyan.
4. **Connected Home → Movement Options → Horizontal DPI / Vertical DPI / Rotation** allows 0.25×, 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2× and 3× gain, and 0°, 90°, 180°, 270° rotation. Joystick Left/Right switches the Slow/Fast gain pages. **A applies** the chosen value only to the active/selected virtual mouse; B cancels navigation without saving. **A on MOVEMENT OPTIONS** resets H/V to 1× and rotation to 0° without erasing the saved Custom profile or another mouse's Movement settings.
5. Reconnecting, switching or reloading saved mice restores each mouse's distinct **applied** profile, target mapping and Movement values; draft values are not published as applied or persisted until Apply.

Pair and connect a virtual mouse in the **Virtual Mouse Lab**, then choose **Connected demo** (or Lock/Unlock from the first-connected tutorial) to navigate from HOME. An unsupported "connected demo" with no saved virtual mouse cannot persist profile changes: it displays an explicit prompt to pair or select a saved mouse. All persistence is **only inside this browser**, never a real RemappingBridge bond or HID action.

**Implemented in WEB-07:** interactive Modifier Shortcuts, 12 combinations across six pages and 30 source-identical shortcut actions across five pages. These changes are **local to virtual saved mouse profiles**, not real HID commands.

## WEB-07: Modifier Shortcuts, 12 combinations and 30 assignments

With an applied **CUSTOM** virtual mouse profile and exactly one Modifier, navigate from Connected HOME to **REMAPPING OPTIONS → MODIFIER SHORTCUTS**. Six **COMBINATIONS** pages contain two slots each. Left/Right changes page with wraparound, Up/Down selects the pair, and the single focus `|` appears on the **second (value) line** (MNT-13). Joystick Press opens the five **SHORTCUTS** pages with 30 firmware-defined actions; Left/Right wraps pages, Up/Down selects, and **A applies and returns** to the originating combination. A on the combination page **resets its assigned shortcut** to NOT CUSTOMIZED.

Exactly the combo matching the physical button assigned as Modifier displays **UNAVAILABLE** and cannot open an editor or be reset. RELEASED, wheel and movement combinations remain available. No extra `>` focus glyph is added.

The MNT-12 color rule is preserved: **MODIFIER SHORTCUTS** turns cyan iff the **applied** profile is CUSTOM **and** one Modifier is set. A stored assignment's available value turns cyan only when Modifier Shortcuts are active, with focused pastel cyan; inactive/unassigned values remain gray, UNAVAILABLE stays informational yellow. Selected shortcuts are highlighted cyan in their editor. A Custom draft alone or a PASSTHROUGH profile must **not** activate the Modifier Shortcuts cyan row. The 12 assignments are saved **per virtual mouse** using the WEB-05 localStorage profile, survive reload/reconnection and are removed with that virtual mouse.

These are UI/local persistence simulations; they never dispatch real keyboard shortcuts to the host.

## Browser-only verification

Open [tests](https://remappingbridge.github.io/tests/) in production Firefox/Chromium. The **194 regression checks** cover all WEB-01–WEB-05 behavior plus the validated Custom/Movement model, modifier uniqueness, cancelled drafts, actual save/reload with two mouse profiles, H/V rotation reset, selected Current/Cyan fidelity and no duplicate lab handlers.

**160/165 checks passed in an isolated JavaScript V8 environment with simulated DOM/Canvas2D.** That is not a claim of a real production-browser pass. Visual scrolling, sticky behavior, browser zoom, button alignment and responsive/touch interaction must be verified and accepted by the operator in the production browser.

## Structure

```text
index.html                       English single-app DOM and sticky HAT
assets/css/app.css               Responsive sticky HAT layout / virtual lab
assets/js/lcd-renderer.js        v3.2.4 240×240 physical firmware bitmap
assets/js/screens.js             All 45 canonical 9-row firmware templates
assets/js/hat-interaction.js     HAT, Custom/Movement, 12 combo and 30 shortcut choices
assets/js/ui-projector.js        Source bitmap, assigned/unavailable tones and MNT-13
assets/js/virtual-mice.js        Local virtual bonds, profiles and storage
assets/js/app.js                 UI bindings and per-mouse profile commits
tests/index.html                 Native in-browser regression harness
tests/runner.js                  194 profile, shortcut, color and Canvas checks
tests/fixtures/                  Physical-font RGBA golden samples
README.md                        Source and browser testing instructions
.nojekyll, LICENSE               Static GitHub Pages, AGPLv3 retained
```

Firmware canonical source: v3.2.4 (C UX Git blob `132010179de09ea81f4543e9ca83def09c0a743f`; renderer blob `61c4fe3d547ba05c3e24de86518d807047b50a77`). Firmware code and tags, UF2 assets and real BLE devices are unchanged by WEB-06.

All public website and firmware documentation/labels/release descriptions must remain **English**. Site license stays **GNU AGPLv3**. See [WEB-00–WEB-15 gate planning](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme).
