# glTF Interactivity

Run `yarn workspace luma.gl-examples-deck-gltf-interactivity start`.
The website lists this deck.gl ScenegraphLayer example in the **glTF** category.
Traffic Light is selected by default.

The compact black luma.gl InfoBox starts collapsed. Its toolbar has a sample selector,
previous/next carets, **Run tests**, and **Reset**. Info contains instructions, credits,
and diagnostics. Behavior Graph lists the authored CPU interpreter nodes.

Loads four Khronos/Needle assets directly from
[`glTF-Test-Assets-Interactivity`](https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity/tree/926bec45dfbe052bad4013ab5852ed2f4042bff5),
pinned to revision `926bec45dfbe052bad4013ab5852ed2f4042bff5`:

- Branch, Sequence, and Switch are **self-running test suites**. Their checkmarks
  are graph outputs, not input checkboxes. Their authored `event/onStart` runs on
  load. **Run tests** replays the suite and **Reset** clears its results. Clicking
  the canvas only controls the camera; it does not run or reset tests.
- Traffic Light is **interactive**. Click the highlighted button on the left post
  to play the authored timed sequence. Click the right post button to advance its
  phase. Reset restores source material colors, variables, and cancels delayed work.
  The small DOM hit targets track the actual source button nodes as the camera moves.

Selection dispatch targets only the selected source node. The runtime executes the
asset's original selection events, material pointer writes, conversions, and delays;
there is no replacement traffic-light state machine. Delays use `tick` seconds rather
than JavaScript timers. The example demonstrates a supported subset, not conformance.

Readable pixel-sized test labels use the authored node names and transforms, replacing
unsupported SDF glyph rendering. Check icon meshes, textures, and graph bindings remain
intact. Texture atlas transforms are preserved for the PBR renderer.

Network access to raw.githubusercontent.com is required. Assets are not bundled.
Asset credit: © 2025 The Khronos Group and Needle, CC BY 4.0 International.
