# Playwright support

The Playwright support in `devtools` is split into reusable modules plus a thin repo CLI wrapper.

Supported capabilities:
- launch a Chromium-family browser with repo-configured options
- resolve website examples from aliases or route segments
- open any website example with `yarn website-debug --example ...`
- select `WebGPU`, `WebGPU` with the `MAX` badge, `WebGPU` with the `COMPAT` badge, or `WebGL2`
- collect console logs, page errors, and failed requests
- capture screenshots and probe WebGPU availability
- request raw HDR and SDR planes from examples that expose the HDR capture contract

CLI examples:

```sh
yarn website-debug --example showcase/persistence
yarn website-debug --example api/animation --backend webgpu-core
yarn website-debug --example api/animation --backend webgpu-max
yarn website-debug --example api/animation --backend webgpu-compatibility
yarn website-debug --example persistence --backend webgl2
yarn website-debug --example showcase/tempest-ocean --backend webgpu-core --hdr-capture --viewport-width 1580 --viewport-height 780
yarn website-debug --attach=http://127.0.0.1:9222 --target-tab persistence
```

Example resolution rules:
- absolute route: `/examples/showcase/persistence`
- route segment: `showcase/persistence`
- repo alias from `.ocularrc.js`: `persistence`
- full URL: `http://127.0.0.1:3000/examples/showcase/persistence`

Artifacts:
- `.playwright-artifacts/website-playwright.png`
- `.playwright-artifacts/webgpu-probe.json`
- `.playwright-artifacts/page-diagnostics.json`
- `.playwright-artifacts/last-url.txt`

`--hdr-capture` preserves the normal `website-playwright.png` and adds:

- `.playwright-artifacts/website-playwright-hdr.rgba16float`: tightly packed, top-down,
  linear Display-P3 RGBA16F pixels
- `.playwright-artifacts/website-playwright-sdr.rgba8`: tightly packed, top-down,
  Display-P3 RGBA8 pixels with the sRGB transfer function
- `.playwright-artifacts/website-playwright-hdr.json`: version 2 manifest with the example ID,
  integer target peak in nits, dimensions, color metadata, row strides, byte lengths, and raw
  artifact filenames

For examples using the website's high-dynamic-range canvas profile, the website captures the active
WebGPU `rgba16float` presentation texture after rendering and before submission. An
`AnimationLoopTemplate` may implement `captureHDRScreenshot()` to provide a specialized paired
capture instead. Both paths return a non-empty `exampleId` plus an integer `targetPeakNits` in the
range 203–10000. The website exposes the active path to browser automation as
`window.lumaCaptureHDRScreenshot()` after the example finishes initializing and removes it during
route cleanup. Generic capture rejects SDR canvas fallbacks instead of writing falsely tagged data.
The runner adds `luma-hdr-capture=1` to the example URL so capture can request the FP16 canvas even
when browser media emulation reports an SDR display; the canvas configuration itself must still
confirm Display-P3 extended presentation.

Use `--viewport-width` and `--viewport-height` to set positive integer viewport dimensions before
capture. Capture mode uses CSS/DPR-compatible drawing-buffer sizing; the examples layout means a
`1580x780` viewport produces a `1280x720` raw render target for routes rendered beside the 300-pixel
examples sidebar. Full-width routes use `1310x780` for the same raw target size.

Backend behavior:
- explicit `--backend webgpu-core`, `--backend webgpu-max`, `--backend webgpu-compatibility`, or `--backend webgl2` clicks the corresponding `DeviceTabs` entry
- `--backend webgpu` remains an alias for `webgpu-core`
- with no explicit backend, the runner prefers core WebGPU, then compatibility WebGPU, then falls back to `WebGL2`
