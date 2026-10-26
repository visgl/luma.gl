# Riverfront ambient occlusion

A deck.gl riverfront scene demonstrating luma.gl's existing SSAO pass. Toggle ambient occlusion
to compare building faces, with optional water reflections and surface outlines.

Run `yarn workspace luma.gl-examples-deck-ambient-occlusion start` from the repository root.
The website route is `/examples/deck/ambient-occlusion`.

`SceneBufferEffect` captures the Deck layers into color, depth, and normal buffers. The example
then runs the reusable luma.gl effect passes over those buffers through `ShaderPassRenderer`; the
river, buildings, camera controls, and picking remain Deck-owned.
