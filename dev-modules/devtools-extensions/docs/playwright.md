# Playwright support

The Playwright support in `devtools` is split into reusable modules plus a thin repo CLI wrapper.

Supported capabilities:
- launch a Chromium-family browser with repo-configured options
- resolve website examples from aliases or route segments
- open any website example with `yarn website-debug --example ...`
- select `WebGPU` or `WebGL2`
- collect console logs, page errors, and failed requests
- capture screenshots and probe WebGPU availability

CLI examples:

```sh
yarn website-debug --example showcase/persistence
yarn website-debug --example api/animation --backend webgpu
yarn website-debug --example persistence --backend webgl2
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

Backend behavior:
- explicit `--backend webgpu` or `--backend webgl2` clicks the corresponding `DeviceTabs` entry
- with no explicit backend, the runner prefers `WebGPU` and falls back to `WebGL2`
