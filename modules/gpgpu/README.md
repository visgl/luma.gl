# @luma.gl/gpgpu

GPU data primitives and immediate GPU computations for luma.gl.

- `@luma.gl/gpgpu` exposes portable operations and evaluators.
- `@luma.gl/gpgpu/gpu-data` exposes `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, formats, and chunk utilities.
- `/cpu`, `/webgl`, and `/webgpu` expose operation backends.

Execution graphs, graph-based algorithms, and higher-level processing now live in [`@luma.gl/graph`](../graph/README.md).

## Execution foundation

The root also exports `Kernel` and `RenderKernel`. These implementations depend on core and
shaders, not engine or graph. WebGL operations execute through RenderKernel.
`Computation`, `ShaderInputs`, `GPUVectorModel`, `GPUVectorGeometry`, `BufferTransform`, and `TextureTransform` belong to `@luma.gl/engine`, and
`TableTransform` belongs to `@luma.gl/engine/tables`.
Dynamic resources belong to `@luma.gl/core/dynamic`, with compatibility exports here.
The `_internal/*` subpaths support shared platform information and dynamic-resource compatibility exports; they are not application APIs. Engine owns its prop-comparison, ID-generation, and rendering debug helpers.

## Optional Arrow adapters

`@luma.gl/gpgpu/arrow` provides primitive conversion, GPU vector upload and readback.
Install the optional `apache-arrow` peer to use this entry. Generic package roots do not load Arrow.
See the [Arrow adapter reference](../../docs/api-reference/arrow/README.mdx) for ownership, streaming and package boundaries.
