# RemappingBridge — Web Simulator

This repository hosts the static web simulator for [RemappingBridge](https://github.com/remappingbridge/remappingbridge). **All public-facing text is in English**, including accessible names, buttons, feedback messages, test reports, documentation, and future release notes.

## Current status

**WEB-01 accepted:** a single `index.html` page, local CSS and JavaScript, a stylized Pico 2 W LCD/HAT preview, nine clickable HAT controls, feedback and a counter with a Clear action, responsive layout, and a browser-only test page.

The LCD currently shows the exact source text of `BLU2USB_SCREEN_SEARCHING_FIRST` from firmware **v3.2.3** (`f38c5fd15c68ea9a36d3b05912727788d7b98e81`). It is an **HTML text preview, not a pixel-accurate framebuffer**. The complete 240×240 Canvas renderer belongs to WEB-02, HAT firmware navigation and Help/Lock to WEB-03, all 45 screens to WEB-04, simulated Bluetooth and persistence to WEB-05, Movement and Custom remapping to WEB-06, Modifier Shortcuts to WEB-07, brightness limited to 0–100% and final styling to WEB-08, diagnostic scenarios to WEB-09, and full parity checks to WEB-10.

The current controls **only record demonstration input**. The page does not connect to a physical Pico, Bluetooth mouse, USB HID host, flash memory, or firmware. No telemetry or external API is used.

## Open in a browser

The intended production address is **https://remappingbridge.github.io/** once GitHub Pages is configured to publish the `main` branch at `/(root)`. Publication must be verified before claiming the address is live.

Alternatively, open `index.html` directly (`file://`) or serve the repository over HTTP:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`. The counter increases each time a HAT button is clicked; **Clear** resets it to `00`.

The self-contained browser test harness is `tests/index.html`, also available at `http://localhost:8000/tests/`. It does not require Node.js, npm, a bundler, CDN, or a project-owned GitHub Actions workflow. Results must be checked in a real browser; the presence of the harness alone does not prove a passing browser run.

## Files

```text
index.html            Only public application page
.nojekyll             Serve static files without a Jekyll build
assets/css/app.css    Responsive styling and rounded controls
assets/js/app.js      Static preview, bootstrap, and HAT feedback
tests/index.html      Browser-only test page
tests/runner.js       Tests without build dependencies
README.md             Repository documentation
LICENSE               Existing GNU AGPLv3 license
```

## English-only content policy

- All UI copy, screen reader labels (`aria-*`), placeholders, browser test messages, documentation, captions, and GitHub Release descriptions **must use English**.
- Preserve the **literal English LCD firmware strings** and stable command/ID identifiers; do not translate or paraphrase strings used for firmware parity.
- Every later WEB gate must review newly added text for English-only output. Historical version tags, hash values, code identifiers, and proper nouns are not translated.
- Do not introduce a language selector or additional navigation page; the simulator remains a single-page static application.
- The firmware repository has a matching English-only policy. Translating published release notes must never rewrite firmware tags, binaries, or `SHA256SUMS`.

## GitHub Pages and product documentation

To use branch-based Pages publishing, an authorized repository administrator selects **Settings → Pages → Deploy from a branch → main / (root)**. This project does not require a custom build workflow. The interactive demo will be linked from the firmware README using a **clickable static preview**, because GitHub README pages do not execute an embedded JavaScript application.

Planning and acceptance records: [WEB-00–WEB-15](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme). Reference desktop simulator: [mouse-ui](https://github.com/remappingbridge/mouse-ui).

## License

The site's existing **GNU AGPLv3** license is preserved. The firmware source uses **CC0 1.0**; the screen text preview is derived from that source. No third-party image or CDN dependency has been added.
