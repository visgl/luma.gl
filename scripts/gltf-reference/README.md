# glTF reference evidence

`yarn gltf:reference-evidence --headless --software-gpu` captures the glTF showcase with a fixed
camera and rendering contract on WebGPU core and WebGL2. Each invocation creates a unique retained
directory under `.playwright-artifacts/gltf-reference/` unless `--artifact-base` selects another
parent.

Unless `--skip-website-build` is supplied, the command first builds the workspace packages and then
the production website. This makes the capture self-contained on a clean checkout; the website
imports workspace declarations from `dist` and cannot be built reliably before those packages.

CI captures on GitHub's fixed `macos-15` M1 runner without software-GPU overrides. The Ubuntu
CPU-backed WebGPU adapter destroys its device when this bump-material PBR command buffer is
submitted, so it cannot produce a trustworthy image gate. Every manifest records the actual
adapter, renderer, and backend identity; `--software-gpu` remains available for local diagnostics.

The run directory contains:

- a canvas-only PNG and machine-readable evidence document for each backend;
- browser console, page-error, request-failure, and WebGPU-probe diagnostics;
- a highlighted WebGPU/WebGL2 difference PNG; and
- `manifest.json`, including the comparison tolerances and pinned Khronos source revisions.

The capture disables animation, automatic LOD, model lights, and external image-based lighting. It
uses fixed fallback lights, sRGB output, no tone mapper, exposure 1, a 1280x720 viewport, and an
explicit yaw, pitch, and distance multiplier. Overlapping website chrome is hidden after the
evidence document is ready so that the PNG contains only the canvas render. Evidence records asset
transfer sizes, load and scenegraph creation time, average frame CPU time, animation CPU time,
luma.gl GPU residency, draw counts, submitted index and vertex references, and triangles. Shader
compilation time is explicitly `null` until the device abstraction exposes a backend-neutral
measurement rather than substituting scenegraph or first-draw CPU time.

The default image gate marks a pixel different when any RGBA channel differs by more than 12 and
allows at most 5% differing pixels. The difference image colors those pixels magenta. These values
are versioned in the manifest and should only be tightened or relaxed with retained WebGPU/WebGL2
evidence from the same software and hardware configuration.

The Khronos glTF Sample Viewer source and deployment commits are pinned, but this command does not
capture the external viewer. A Sample Viewer reference frame requires separately approved browser
access and remains an explicit Tranche 0 gap; the manifest reports that status instead of implying a
comparison happened.

The production showcase currently emits React hydration diagnostics 418, 423, and 425 from the
Docusaurus shell even without the reference query. They remain in each `page-diagnostics.json` for
visibility, but the glTF gate narrowly excludes those known recoverable messages. Every other
console error, page error, or request failure fails the capture.
