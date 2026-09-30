# Riverfront effects

A WebGPU deck.gl scene with HDR bloom, surface edges, a visible-surface selection outline,
and normal, depth, selection, and previous-frame views. Click a building to move the outline.

Run `yarn workspace luma.gl-examples-deck-scene-buffers start` from the repository root.
The website route is `/examples/deck/scene-buffers`.

`SceneBufferEffect` captures the explicitly participating layers into a shared `GBuffer` per
view. The example-owned final effect consumes those buffers with `ShaderPassRenderer` and
presents the resulting image. Bright roof beacons retain HDR radiance until tone mapping;
the glass pavilion blends after opaque capture and does not replace opaque depth or normals.

The adapter supports multiple views, but this final presentation example intentionally has
one view. The final effect displays the captured scene; unrelated Deck layers or external
basemaps must be integrated explicitly before using this composition pattern elsewhere.

The previous-frame view is a diagnostic of the last rendered capture, not temporal smoothing.
History uses a second complete set of scene textures. Reset it on camera cuts or scene
replacement. Transparent objects are absent from normals and selection masks. No motion
vectors, temporal rejection, or screen-space reflections are applied here.

Four capture passes run in addition to Deck's normal draw. Captures cost about 17 bytes per
physical canvas pixel per view, doubled with history, before bloom and presentation targets.
The adapter uses Deck's experimental layer-pass interface and the repository's pinned patch;
it is experimental and currently requires WebGPU.

Run `yarn workspace luma.gl-examples-deck-scene-buffers test:visual` for the browser checks.
