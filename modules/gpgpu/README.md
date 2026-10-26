# @luma.gl/gpgpu

GPU data primitives and immediate GPU computations for luma.gl.

- `@luma.gl/gpgpu` exposes portable operations and evaluators.
- `@luma.gl/gpgpu/gpu-data` exposes `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, formats, and chunk utilities.
- `/cpu`, `/webgl`, and `/webgpu` expose operation backends.

Execution graphs, graph-based algorithms, and higher-level processing now live in [`@luma.gl/graph`](../graph/README.md).

## Execution foundation

The root also exports `Kernel`, `Computation`, `GPUVectorModel`, `GPUVectorGeometry`,
`BufferTransform`, `TextureTransform`, `ShaderInputs`, `DynamicBuffer`, and `DynamicTexture`.
These implementations depend on core and shadertools, not engine or graph. Engine retains
compatibility re-exports; constructors and resource ownership are shared across import paths.
The `_internal/*` subpaths support engine implementation sharing and are not application APIs.
