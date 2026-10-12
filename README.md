# RemappingBridge — Web Simulator

An **English-only**, browser-native single-page simulation of the [RemappingBridge firmware](https://github.com/remappingbridge/remappingbridge) (Raspberry Pi Pico 2 W / Waveshare Pico-LCD-1.3 HAT).

**WEB-01 through WEB-04 were accepted. WEB-05 is a candidate awaiting the operator's production-browser acceptance.**

## Open in production

- **Simulator:** https://remappingbridge.github.io/
- **Browser tests:** https://remappingbridge.github.io/tests/

This static project does not use Node.js, npm, bundlers, external CDNs, a backend, telemetry or custom GitHub Actions workflows.

## LCD, HAT, navigation and the English key guide

The panel imitates the physical HAT: a **left joystick**, **smaller centered LCD**, and **A/B/X/Y in a single vertical column on the right**. The LCD remains an exact **240×240 logical Canvas**, 9×21 text, authentic 5×7 bitmaps, RGB565 semantic foreground colors, and the MNT-13 `|` marker on the second/value line of two-line combination choices. The web-only dark-magenta background is always **Gentle `#300c39`**; there is no background selector.

A concise general English HAT guide appears **immediately below the physical device and outside the LCD**:

> **KEY B** — Go back or cancel on most screens (except Connected Home).
>
> **KEY Y** — Lock the display; press and release any HAT control to unlock and return Home.

A smaller sentence explains that **SEARCHING FIRST MOUSE** is a didactic, non-locking screen and some Retry screens have special controls. This qualified English wording avoids falsely promising a global shortcut on firmware exceptions. Unlock consumes its first press/release, and input acts on release rather than press.

All **45 original v3.2.4 firmware screen templates** are available (source `src/ux_model/ux_model.c`, Git blob `132010179de09ea81f4543e9ca83def09c0a743f`). Browse them using joystick/keyboard Help/Back/Lock, or expand **Inspect all 45 firmware screens** for visual QA. The first-mouse tutorial cannot Lock, matching firmware source.

## WEB-05 — Virtual Mouse Lab

The **Virtual Mouse Lab** is a completely local **simulation**, NOT physical Bluetooth pairing.

Use **Start Pair New**, **Complete Successfully** and **Simulate Failure** to test connection results. Up to **eight** uniquely named virtual mouse identities can be saved; each bond includes an independent default profile container (targets, Movement and shortcut values). Pairing the same name again cannot create duplicate bonds. Each virtual device has a stable ID, name, front-selection state, connected/disconnected state, and per-device data.

- **Search Saved** reconnects the front/selected previously paired virtual mouse, never inventing a new bond.
- **Advance to Timeout (+5 ticks)** advances a logical, deterministic clock—no background timers. Timeout opens the matching Retry screen. Failed/canceled/superseded attempts never reconnect an outdated mouse.
- **Disconnect** preserves saved bonds. **Remove Saved Mouse** removes the selected device and its associated profile, clearing the active connection if necessary. **Reboot Virtual Device** clears the current connection and pending work while retaining bonds.
- **Clear All Virtual Data** resets saved profiles, bonds, front selection, connection and history. Events are timestamped with logical ticks and maintained in a bounded history. The scenario selector remains available for demonstration-only visual screens.
- **LocalStorage persistence** uses schema `remappingbridge-virtual-mice-v1`, with validation of the 0–8 device list, profile structure, IDs, names and event history. Reloads preserve valid saved data without duplicating bonds; pending asynchronous connection results are intentionally **not persisted**. If storage is blocked, full or corrupted, the UI clearly says **Memory only — storage unavailable** and allows safe testing without claiming durable storage.

On the real device the firmware can discover and bond mice through Bluetooth; **the website does not communicate with BLE, USB or HID**, and cannot alter the Pico. Full simulated Custom Remapping/Movement edits are WEB-06; Modifier Shortcuts assignment semantics are WEB-07. WEB-05 stores separate profile placeholders but does not claim to have implemented those editors.

## Browser validation

Open the [browser test page](https://remappingbridge.github.io/tests/). The **134 regression assertions** cover the original 45 screen rasterizations, Help/Back/Lock, focus, original foreground tones, fixed Gentle, eight bond capacity, first pairing, reconnect, timeout, cancellation/stale response, front-device selection, connected/offline removal, reboot, reset, profile independence, schema validation, reload, disabled storage and live Canvas/UI wiring.

**134/134 passed in an isolated JavaScript V8/DOM/Canvas2D test harness.** This is **not** a statement that a real production Firefox browser has passed; the operator's test is required before WEB-05 is accepted.

To manually test: pair two differently named virtual mice, disconnect, choose one in the Saved mouse list, reconnect, reload the site, browse to Saved Devices, remove the active mouse, trigger a timeout, and clear the virtual database. Check that the general key guide is visible and the LCD uses the same vivid Gentle color.

## Repository files

```text
index.html                       One public application page (English)
assets/css/app.css               Accessible responsive HAT and local lab
assets/js/lcd-renderer.js        240×240 firmware bitmap/semantic colors
assets/js/screens.js             45 exact canonical source templates
assets/js/hat-interaction.js     HAT/Help/Lock + mock saved bond routes
assets/js/ui-projector.js        Dynamic LCD names, colors and focus
assets/js/virtual-mice.js        WEB-05 local storage and state model
assets/js/app.js                 Browser event wiring / local simulation
tests/index.html                 Browser-only regression runner
tests/runner.js                  134 checks incl. persistence and UI
tests/fixtures/                  Frozen RGB frame sample checks
.nojekyll                        Static Pages without a Jekyll transform
LICENSE                          Existing GNU AGPLv3 unchanged
```

## License and public language

All user-facing website and firmware repository text, README documentation, accessible labels, UI messages, test results and GitHub release descriptions must remain **English**. The source LCD strings are preserved and do not get translated.

The site retains **GNU AGPLv3**, while the firmware UI/source uses **CC0 1.0**. No hardware UF2, firmware tag, release assets or actual pairing information is changed by this gate.

Gated implementation evidence: [WEB-00–WEB-15](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme).
