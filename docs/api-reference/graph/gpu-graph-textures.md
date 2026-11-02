# Texture values and execution bindings

Reusable `GPUGraph` programs declare texture inputs without allocating storage or fixing their
size. Operations declare their own texture results. Supply actual textures when preparing or
running the compiled program. `GPUSimpleGraph` supports the same texture bindings and copy
operations on WebGPU; its evaluator API is unchanged.

## Declare and copy a texture

```typescript
import type {Texture} from '@luma.gl/core';
import {GPUGraph, GPUCopyOperation, gpuGraph} from '@luma.gl/graph';

const graph = new GPUGraph();
// Alternatively: new GPUSimpleGraph(), imported from @luma.gl/graph/gpu-simple-graph.
graph.addInput('image', gpuGraph.texture({format: 'rgba8unorm'}));
graph.add(new GPUCopyOperation({input: 'image', output: 'result'}));

const compiled = graph.compile<{result: Texture}>(device, {outputs: ['result']});
const {result} = await compiled.run({inputs: {image: sourceTexture}});
// result has the input's dimensions and mip/layer topology, with independent storage.
// Use it for later GPU work, then destroy it.
result.destroy();
compiled.destroy();
// sourceTexture remains caller-owned.
```

Use the output-map type argument for texture or mixed programs. Existing numeric programs keep
their default `Record<string, GPUVector>` result type. The map describes the selected results;
it does not select outputs or replace runtime format/binding validation. For a result that may
use either allocated storage or a caller-supplied view, use `GPUGraphTextureBinding` (`Texture |
TextureView`).

`GPUCopyOperation` preserves bytes, dimensions, and every selected mip/layer. It performs no
sampling, conversion, resizing, or mip generation. Copies require single-sampled storage,
`COPY_SRC` on the source, and `COPY_DST` on a supplied destination.

## Texture descriptors

| Property | Meaning |
| --- | --- |
| `format` | Exact stored texture format. |
| `dimension` | View dimension; defaults to `2d` when no extent source supplies it. |
| `extent` | Optional fixed `{width, height, depth?}` or inherited `{like: 'input', scale?: [x, y]}`. |
| `mipLevels` | Optional constraint on an input; otherwise inherited from an extent source or defaults to one for a result. |
| `samples` | Optional constraint on an input; otherwise inherited from an extent source or defaults to one for a result. |

An input without `extent` takes its size from the bound texture or selected view. The same
compiled program can accept a different size on its next invocation. Fixed dimensions constrain
bindings; they do not resize them.

For a produced texture, `{like: 'image'}` takes dimensions from that logical value. Scaling
applies to width and height with `max(1, round(size * scale))`; depth is preserved. Specify
`mipLevels: 1` when producing a single-level downsampled image from a mipmapped input.
All extents must be known during preparation. GPU-generated texture sizes are not supported.

## Operation-produced textures

Custom GPUGraph operations use the existing operation contract and explicit lowering descriptors:

```typescript
const operation = {
  id: 'half-size-filter',
  type: 'my-filter',
  contract: {
    values: [
      {value: 'image', access: 'read', textureUsage: 'sampled'},
      {value: 'filtered', access: 'write', textureUsage: 'render-attachment'}
    ],
    outputs: {
      filtered: gpuGraph.texture({
        format: 'rgba16float',
        extent: {like: 'image', scale: [0.5, 0.5]},
        mipLevels: 1,
        samples: 1
      })
    }
  }
} satisfies GPUOperation;
graph.add(operation);
```

Import `GPUOperation` from `@luma.gl/graph`. Supply a matching `GPUOperationLowering` in
`compile(device, {lowerings: [...]})`. Its lowering resolves named textures with
`context.resolveTextureView('image')` and contributes render/compute/copy nodes with their actual
resource uses. The operation contract and lowered resource accesses must agree; contracts do not
replace command-level hazard declarations.

`textureUsage` is required for reusable texture accesses. Supported usages are `sampled`,
`storage-read`, `storage-write`, `storage-read-write`, `render-attachment`, `copy-source`, and
`copy-destination`. The planner unions required usage flags across consumers. Allocated textures
also support sampling and, when single-sampled, copy-source access for downstream use/readback.
Caller-supplied textures must already support the usages required by the program.

Inputs are read-only. Results must have a producer before a consumer, and are single-assignment.
An extent source must also be a declared read so its dependency is explicit.

## Selected views and output targets

Supply a `TextureView` to bind a selected mip/layer range. Sizes are relative to the selected
base mip, and the graph preserves that selection when lowering and encoding:

```typescript
import type {GPUGraphTextureBinding} from '@luma.gl/graph';

const compiled = graph.compile<{result: GPUGraphTextureBinding}>(device);
const image = sourceTexture.createView({
  dimension: '2d', baseMipLevel: 1, mipLevelCount: 1,
  baseArrayLayer: 2, arrayLayerCount: 1
});
const result = destinationTexture.createView({
  dimension: '2d', baseMipLevel: 0, mipLevelCount: 1,
  baseArrayLayer: 0, arrayLayerCount: 1
});
const execution = compiled.prepare({
  inputs: {image},
  outputTargets: {result}
});
```

The destination must match the produced value's format, extent, dimension, mip count, and sample
count. Its backing texture can be larger than the selected view. Neither the supplied view nor
its backing texture becomes graph-owned. Format-reinterpreting and partial-aspect views are not
supported in this reusable binding path.

Writable values cannot alias another bound value's backing texture, even through disjoint views.
Read-only aliases are allowed. This intentionally conservative rule can be relaxed separately.

## Encoding and ownership

```typescript
const encoder = device.createCommandEncoder();
try {
  execution.encode(encoder);
  // Append other work that consumes execution.outputs.result.
  device.submit(encoder.finish());
} finally {
  execution.destroy();
  encoder.destroy();
}
```

Preparation allocates results and temporary textures without submitting commands. Encoding is
single-use and borrows the encoder. Keep bindings, the compiled program, and the prepared
execution alive through submission. After submission, destroy the execution to release temporary
storage. Selected allocated outputs belong to the caller and survive execution destruction;
selected borrowed outputs retain their original identity and ownership.

For cancellation, abandon the encoder before destroying the prepared execution. Selected allocated
outputs still belong to its caller and must be released explicitly. `run()` handles preparation,
submission, and failure cleanup, returning selected outputs only on success.

## Backend scope

- GPUGraph supports texture copies and custom lowerings alongside numeric operations, through
  both `run()` and caller-owned `prepare()`/`encode()`.
- SimpleGraph supports mixed numeric and texture-copy operations through `run()` on WebGPU.
  Its new `prepare()` path currently supports texture-copy-only programs; numeric evaluator
  preparation remains asynchronous and is not exposed through that path.
- SimpleGraph texture programs reject WebGL at compilation. Existing numeric/evaluator WebGL
  execution remains unchanged.
- Persistent texture state, effect adapters, scoped composition, automatic cross-effect sharing,
  texture allocation reuse, and common-producer discovery are subsequent work. This foundation
  allocates independent per-invocation texture storage.

The existing low-level `graph.texture()` and `GPUGraphCompiler` APIs remain available for concrete
resource descriptors. Their resource and view rules are described in
[buffers and textures](../experimental/gpu-core/resources.md).
