# RemappingBridge — Web Simulator

An **English-only**, static, single-page browser simulator of the [RemappingBridge](https://github.com/remappingbridge/remappingbridge) Pico 2 W and Waveshare Pico-LCD-1.3 firmware.

**WEB-01–WEB-09 accepted by the operator. WEB-10 is the current full-parity/static-publication candidate; operator acceptance is pending.**

## Production

[Open the simulator](https://remappingbridge.github.io/) · [Run browser-only tests](https://remappingbridge.github.io/tests/)

The site consists solely of HTML/CSS/native JavaScript. No npm, Node.js, bundler, external CDN, service worker, application backend, telemetry, hosted storage, Web Bluetooth or custom Pages build workflow is required.

## WEB-10: full firmware screen parity and static deployment audit

- The `tests/fixtures/firmware-screens-v3.2.4.js` independent fixture is generated from the **actual release v3.2.4 C source literals**, `src/ux_model/ux_model.c` Git blob `132010179de09ea81f4543e9ca83def09c0a743f`, at release commit `69a640d9767ec7198572eb9b5073ed71f8f3d202`.
- Direct source auditing found **45 of 45 exact firmware screen literals and dynamic row masks matching the web model**. The browser test runner additionally compares the fixture with every displayed source template, beside the prior exact LCD font/geometry/color goldens, movement, shortcuts, Help, Lock, diagnostic and multi-mouse state checks.
- The `tests/index.html` copy has been updated to match the accepted deletion of the optional brightness/density controls and the correct WEB-10 regression scope. Tests must run in a real browser for production acceptance; no previous isolated harness result should be represented as a real Firefox/Chromium run.
- Source and script assets remain same-origin relative static files with `.nojekyll` and no web build dependency. GitHub Pages deployment and versioned site `main` SHA are tracked in planner evidence.
- WEB-10 is **not automatically accepted** merely because source parity and Pages deploy succeed. Manual Firefox, Chromium, smartphone, keyboard/touch, HiDPI/zoom, clipboard/exports, CSS sticky and browser-console checks remain the operator's acceptance tests.

## WEB-09: clean HAT and browser-only diagnostics

Following the operator's explicit WEB-08 acceptance, the three technical lines **PICO 2 W / LCD 240 × 240 / 9 HAT CONTROLS** now occupy the **bottom-right corner of their right-side HAT metadata region**. The accepted **REMAPPINGBRIDGE upper-left** and yellow-dot **VIRTUAL DEVICE lower-left** remain unchanged; the HAT stays sticky while the other panels scroll.

The operator considered the optional **DISPLAY CONTROLS · WEB-08** controls dispensable. Consequently, the entire **LCD appearance / brightness / density** UI and its unused JavaScript module were **removed** in WEB-09. The source-accurate LCD is displayed at normal **100%** web brightness; **KEY Y Lock** still renders the real black framebuffer and unlock returns to normal brightness without a slider. No CSS brightness amplification or alternative background is provided. The WEB-08 large mobile touch HAT, keyboard focus rings, reduced motion support and adaptive layout are retained.

### Diagnostic Inspector (collapsed by default)

Expand **Diagnostic Inspector · scenarios and local evidence** below the normal HAT and mouse lab. The panel is an optional lab, **not a physical-firmware menu**, not a replacement LCD and not a second application or backend.

- **Eight reproducible scenarios:** first use/no saved mice, connected, two mice, remove, stale+failed pairing, saved search timeout, Custom/Movement and Modifier Shortcuts. All playback is **isolated in memory** via a new virtual-mouse model explicitly using `storage:null`, never mutates saved mice or browser localStorage, and cannot connect to real Bluetooth or USB/HID.
- Each playback produces an **independent 240×240 logical diagnostic Canvas** with the same firmware glyph/renderer, **deterministic state hash (FNV-1a)**, canonical screen name, isolated saved-mouse count and event timeline. Re-running a scenario produces the same hash; no random IDs, timestamps, hosted API or server telemetry.
- **Semantic element Inspector:** click a rendered character on the diagnostic Canvas to select a stable `LCD/<SCREEN>/ROW_nn/COL_nn` reference, character, original semantic tone and exact **source pixel bounding rectangle**, not CSS display coordinates. It scales mouse/touch pointer positions into 240×240 pixels. When focused, Enter/Space and arrow keys permit keyboard-only selection. **Copy reference** uses the Clipboard API when permitted, with manual fallback.
- **Local evidence:** download JSON (scenario/source metadata, state hash, deterministic events and selection), TXT (readable local timeline), or the diagnostic **PNG (240×240)**. Downloads originate within the browser using Blob URLs / `canvas.toDataURL`, without upload, analytics or outbound requests. The evidence is explicitly labeled **virtual**, not from a physical Pico/real mouse.
- The timeline includes bounded scenario replay events and subsequent **HAT/live virtual-model actions** as diagnostics, but its entries do not affect reproducible scenario state hashes.

The firmware remains at source **v3.2.4**, including 45 canonical LCD screens, Gentle `#300c39`, all MNT-12/MNT-13 colors and the WEB-07 12-combination/30-shortcut local mouse simulation. No firmware/UF2 or real Bluetooth/HID changes.

**Automated validation:** the native browser runner was executed in an **isolated V8 DOM/Canvas2D harness**, not in the user's live Firefox browser. WEB-09 tests cover deterministic isolated states, 240×240 semantic hit detection, evidence generation, keyboard interaction, obsolete-control absence and all accepted historical HAT/virtual-mouse regressions. Actual layout, copy permission, file downloads and production browser behavior still require operator verification.

### WEB-09 revision: demo state names and Virtual Mouse Lab layout

- **Choose a demo state** has three independent previews: **Searching First Mouse** (`SEARCHING_FIRST`), **First Mouse Connected** (`MOUSE_SAVED`, the real magenta firmware title), and **Home Connected** (`HOME`). The intermediate tutorial can be previewed with any number of virtual mice saved; demo clicks never create, delete or alter virtual bonds. The prior legacy states are preserved internally for reproducible diagnostics and navigation regression tests.
- **Virtual Mouse Lab** now shows **Saved virtual mouse** on the left and **New virtual mouse name** on the right at desktop widths. Each input/select shares its row with its own Search Saved / Start Pair New button; two independent, pending-mode-guarded Complete Successfully and Simulate Failure actions occupy the next line within that card. At narrow widths the cards stack without horizontal clipping.
- **Factory Reset Virtual Mice** is visible beneath both cards. A browser confirmation protects destructive clearing of virtual bonds, profiles, pending tasks and event history. Confirming restores Searching First Mouse, including after a prior saved/demo state; no real Bluetooth or physical firmware is affected.

## WEB-07: always-visible, physically compact HAT

The **physical-HAT-inspired simulator is sticky at the top of the viewport**. Scroll through the Virtual Mouse Lab, screen inspector and session options below while the HAT stays in view. It remains a normal document element, not a detached overlay; its viewport offset, rounded border and shadow remain visible.

The HAT now displays **REMAPPINGBRIDGE in the upper-left corner** and the **yellow-dot VIRTUAL DEVICE indicator in the lower-left corner**, inside its sticky housing. The hardware specifications remain aligned to the **bottom-right** of the right-hand LCD-height column. Narrow screens reserve small corner-label bands to avoid overlapping LCD pixels.

The device has four horizontally aligned regions: **left cross-shaped joystick → reduced 240×240 logical LCD → four narrower, less-rounded A/B/X/Y buttons in a vertical column → right-side Pico / LCD / HAT specifications**. The original top/header and bottom/footer rows are gone; their brand and virtual device status now occupy left corner positions, while technical specifications remain in the right column. The LCD housing uses narrow padding above/below. Responsive CSS preserves the arrangement at narrower widths, with compact metadata.

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

Pair and connect a virtual mouse in the **Virtual Mouse Lab**, then choose **Home Connected** to navigate from HOME. An unsupported "connected demo" with no saved virtual mouse cannot persist profile changes: it displays an explicit prompt to pair or select a saved mouse. All persistence is **only inside this browser**, never a real RemappingBridge bond or HID action.

**Implemented in WEB-07:** interactive Modifier Shortcuts, 12 combinations across six pages and 30 source-identical shortcut actions across five pages. These changes are **local to virtual saved mouse profiles**, not real HID commands.

## WEB-07: Modifier Shortcuts, 12 combinations and 30 assignments

With an applied **CUSTOM** virtual mouse profile and exactly one Modifier, navigate from Connected HOME to **REMAPPING OPTIONS → MODIFIER SHORTCUTS**. Six **COMBINATIONS** pages contain two slots each. Left/Right changes page with wraparound, Up/Down selects the pair, and the single focus `|` appears on the **second (value) line** (MNT-13). Joystick Press opens the five **SHORTCUTS** pages with 30 firmware-defined actions; Left/Right wraps pages, Up/Down selects, and **A applies and returns** to the originating combination. A on the combination page **resets its assigned shortcut** to NOT CUSTOMIZED.

Exactly the combo matching the physical button assigned as Modifier displays **UNAVAILABLE** and cannot open an editor or be reset. RELEASED, wheel and movement combinations remain available. No extra `>` focus glyph is added.

The MNT-12 color rule is preserved: **MODIFIER SHORTCUTS** turns cyan iff the **applied** profile is CUSTOM **and** one Modifier is set. A stored assignment's available value turns cyan only when Modifier Shortcuts are active, with focused pastel cyan; inactive/unassigned values remain gray, UNAVAILABLE stays informational yellow. Selected shortcuts are highlighted cyan in their editor. A Custom draft alone or a PASSTHROUGH profile must **not** activate the Modifier Shortcuts cyan row. The 12 assignments are saved **per virtual mouse** using the WEB-05 localStorage profile, survive reload/reconnection and are removed with that virtual mouse.

These are UI/local persistence simulations; they never dispatch real keyboard shortcuts to the host.

## Browser-only verification

Open [tests](https://remappingbridge.github.io/tests/) in production Firefox/Chromium. The **235 regression checks** cover all WEB-01–WEB-05 behavior plus the validated Custom/Movement model, modifier uniqueness, cancelled drafts, actual save/reload with two mouse profiles, H/V rotation reset, selected Current/Cyan fidelity and no duplicate lab handlers.

**235/235 checks passed in an isolated JavaScript V8 environment with simulated DOM/Canvas2D.** That is not a claim of a real production-browser pass. Visual scrolling, sticky behavior, browser zoom, button alignment and responsive/touch interaction must be verified and accepted by the operator in the production browser.

## Structure

```text
index.html                       English single-app DOM and sticky HAT
assets/css/app.css               Responsive sticky HAT layout / virtual lab
assets/js/lcd-renderer.js        v3.2.4 240×240 physical firmware bitmap
assets/js/screens.js             All 45 canonical 9-row firmware templates
assets/js/hat-interaction.js     HAT, Custom/Movement, 12 combo and 30 shortcut choices
assets/js/ui-projector.js        Source bitmap, assigned/unavailable tones and MNT-13
assets/js/virtual-mice.js        Local virtual bonds, profiles and storage
assets/js/diagnostics.js         Independent local scenarios and pixel Inspector
assets/js/app.js                 UI bindings, mobile HAT and diagnostic exports
tests/index.html                 Native in-browser regression harness
tests/runner.js                  235 profile, diagnostic, shortcut and Canvas checks
tests/fixtures/                  Physical-font RGBA golden samples
README.md                        Source and browser testing instructions
.nojekyll, LICENSE               Static GitHub Pages, AGPLv3 retained
```

Firmware canonical source: v3.2.4 (C UX Git blob `132010179de09ea81f4543e9ca83def09c0a743f`; renderer blob `61c4fe3d547ba05c3e24de86518d807047b50a77`). Firmware code and tags, UF2 assets and real BLE devices are unchanged by WEB-09.

All public website and firmware documentation/labels/release descriptions must remain **English**. Site license stays **GNU AGPLv3**. See [WEB-00–WEB-15 gate planning](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme).
