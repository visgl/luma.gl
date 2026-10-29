# @luma.gl/engine

This is the engine layer of luma.gl

See [luma.gl](http://luma.gl) for documentation.

## Graph integrations

Engine builds on `@luma.gl/graph` and `@luma.gl/gpgpu`. Execution primitives remain
available from engine as compatibility exports, with their implementation owned by gpgpu.
Use `@luma.gl/engine/tables` for `GPUTableModel` and `GPUTableGeometry`,
`@luma.gl/engine/physics` for scenegraph physics integration, and
`@luma.gl/engine/models` for specialized path/polygon rendering models. These optional
entry points keep scenegraph and rendering integration above graph algorithms.

## glTF

Import glTF document types, postprocessing, scene creation, animation, and PBR adapters from
`@luma.gl/engine/gltf`. The optional `@luma.gl/engine/gltf-physics` entry integrates glTF physics
with engine scenegraphs and graph physics. These APIs are not re-exported by the engine root.
