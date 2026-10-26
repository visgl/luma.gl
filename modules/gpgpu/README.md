# @luma.gl/gpgpu

GPU data primitives and immediate GPU computations for luma.gl.

- `@luma.gl/gpgpu` exposes portable operations and evaluators.
- `@luma.gl/gpgpu/gpu-data` exposes `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, formats, and chunk utilities.
- `/cpu`, `/webgl`, and `/webgpu` expose operation backends.

Execution graphs, graph-based algorithms, and higher-level processing now live in [`@luma.gl/graph`](../graph/README.md).

## Execution foundation

The root also exports `Kernel`, `RenderKernel`, `Computation`, and `ShaderInputs`. These implementations depend on core and
shadertools, not engine or graph. WebGL operations execute through RenderKernel.
`GPUVectorModel`, `GPUVectorGeometry`, `BufferTransform`, and `TextureTransform` belong to `@luma.gl/engine`, and
`TableTransform` belongs to `@luma.gl/engine/tables`.
Dynamic resources belong to `@luma.gl/core/dynamic`, with compatibility exports here.
The `_internal/*` subpaths support engine implementation sharing and are not application APIs.
