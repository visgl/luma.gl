# KHR_interactivity + deck.gl ScenegraphLayer

This private deck.gl example uses the **real Khronos** `flow/branch` conformance GLB, which
declares `KHR_interactivity`. It renders that asset with the upstream ScenegraphLayer and
demonstrates the luma.gl interpreter on an intentionally small **replacement demo graph**,
not the complete conformance graph.

The Khronos graph includes `debug/log` and other operations not yet implemented. The
interpreter rejects unsupported operations rather than pretending to execute them. The
original extension is retained for inspection and reported in the UI. The demo graph
exercises `event/onStart` → `flow/branch` → `pointer/set` to scale a source glTF node.
It uses a scenegraph property adapter to map glTF node indices onto luma.gl GroupNodes.

Run `yarn start` in this directory. The asset is served from Khronos GitHub; internet
access and CORS are required. The sample is **not** a Khronos conformance claim.

Source: https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity/tree/main/Tests/Interactivity/flow/branch

Future work: full operation coverage, pointer templates, event/onHover and onSelect,
asset-authored behavior execution, and tests under both backends.
