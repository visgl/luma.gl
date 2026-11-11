# @luma.gl/engine

This is the engine layer of luma.gl

See [luma.gl](http://luma.gl) for documentation.

## Graph integrations

Engine builds on `@luma.gl/graph` and `@luma.gl/graph/gpu-simple-graph`. Execution primitives remain
available from engine as compatibility exports, with their implementation owned by core/dynamic.
Use `@luma.gl/engine/tables` for `GPUTableModel` and `GPUTableGeometry`,
`@luma.gl/engine/physics` for scenegraph physics integration, and
`@luma.gl/engine/models` for specialized path/polygon rendering models. These optional
entry points keep scenegraph and rendering integration above graph algorithms.

## glTF

Import glTF document types, postprocessing, scene creation, animation, and PBR adapters from
`@luma.gl/engine/gltf`. The optional `@luma.gl/engine/gltf-physics` entry integrates glTF physics
with engine scenegraphs and graph physics. These APIs are not re-exported by the engine root.

## Gaussian splats

Import splat data, renderers, picking, residency, and hierarchy helpers from `@luma.gl/engine/splats`.
This optional subpath is not re-exported by the engine root. Graph-backed renderers remain here
for now; extraction of reusable graph operations is a separate migration.

## Text

Text APIs are available through optional flat subpaths:

- `@luma.gl/engine/text`: `TextRenderer`, GPU text data, and text layout utilities.
- `@luma.gl/engine/text-fonts`: CPU font atlas builders, glyph loading, and bundled typeface data.
- `@luma.gl/engine/text-3d`: extruded text geometry and glyph atlas helpers.
- `@luma.gl/engine/text-experimental`: specialized text models and benchmark strategies.

These APIs are not re-exported from the engine root. See the
[text API reference](../../docs/api-reference/engine/text/README.md).

## Effects

Import reusable post-processing and screen-space shader passes from `@luma.gl/engine/effects`.
This optional subpath preserves the existing effects API and is not re-exported from the engine
root. Shaders owns shader-pass contracts; graph owns execution and accepts these pass
definitions without importing engine. See the [effects reference](../../docs/api-reference/effects/README.md).

## Optional Arrow adapters

`@luma.gl/engine/arrow` provides geometry, path/polygon/text rendering adapters and splat conversion.
Install the optional `apache-arrow` peer to use this entry. Generic package roots do not load Arrow.
See the [Arrow adapter reference](../../docs/api-reference/arrow/README.mdx) for ownership, streaming and package boundaries.
