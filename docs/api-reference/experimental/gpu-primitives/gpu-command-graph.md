import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {GPUDataAnalysisExample} from '@site/src/examples';

# GPUCommandGraph

<GPUPrimitivesDocsTabs active="command-graph" />

## Overview

`GPUCommandGraph<Parameters>` declares fixed-capacity WebGPU buffer and texture resources plus
ordered compute, render, and copy nodes. `compile()` returns a `CompiledGPUCommandGraph` that owns
transient resources and node state but borrows every import.

See [Choosing a GPU Data-Processing API](/docs/api-guide/gpu/gpu-data-processing) for guidance on
when to use a command graph, portable GPGPU evaluators, or lower-level compute helpers.

## Concepts

A graph definition describes resources, node uses, and explicit ordering constraints. Compilation
turns that declaration into a stable execution order, validates capacities and usages, allocates
reusable transient storage, and creates node state. Encoding records the compiled work into a
caller-owned command encoder; submission and readback remain explicit application decisions.

Resource-use declarations are both contracts and dependency edges. A storage write followed by a
read creates a hazard the compiler orders automatically. Imports stay caller-owned, while graph
transients and node-created pipelines belong to the compiled graph.

This example composes reduction, histogram, and grid-binning nodes in one reusable graph:

<GPUDataAnalysisExample embedded />

```ts
const graph = new GPUCommandGraph<{time: number}>(device, {id: 'simulation'});
const source = graph.importBuffer(
  {id: 'source', byteLength: sourceBuffer.byteLength, usage: sourceBuffer.usage},
  sourceBuffer
);
const scratch = graph.createTransientBuffer({
  id: 'scratch',
  byteLength: sourceBuffer.byteLength,
  usage: Buffer.STORAGE
});

graph.addComputePass({
  id: 'update',
  resources: [
    {buffer: source, usage: 'storage-read'},
    {buffer: scratch, usage: 'storage-write'}
  ],
  compile: ({device}) => makeExecutableNode(device)
});

const compiled = graph.compile();
const encoding = compiled.encode(device.commandEncoder, {parameters: {time}});
console.log(encoding.stats.cpuEncodeTimeMilliseconds);
```

## Lifecycle and ownership

A graph definition is mutable until `compile()` is called. Compilation freezes the definition,
infers a stable node order, plans transient allocation reuse, creates physical transients, and calls
each node's `compile` callback once. The returned `CompiledGPUCommandGraph` can then be encoded
repeatedly with different parameters and compatible imported-resource replacements.

Imported buffers, textures, `GPUData`, and `GPUVector` chunks are borrowed. The compiled graph owns
only node-created resources, physical transients, and cached texture views/framebuffers. Calling
`destroy()` releases those owned resources and never destroys an import.

## Buffer APIs

### `importBuffer(descriptor, defaultBuffer?)`

Declares caller-owned storage. A default `Buffer` or `DynamicBuffer` may be supplied during graph
construction, or the caller may provide a compatible override to each encoding.

### `createTransientBuffer(descriptor)`

Declares graph-owned scratch storage. Compatible logical transients with non-overlapping lifetimes
may share one physical buffer.

### `createDataView(handle, props)`

Creates a `GraphDataView<T extends GPUVectorFormat>` with `format`, `length`, `byteOffset`,
`byteStride`, and `rowByteLength` metadata.

### `importGPUData(id, data)`

Imports the backing allocation and preserves the supplied `GPUData` range.

### `importGPUVector(id, vector)`

Imports every fixed-width `GPUData` chunk without packing and returns a `GraphVectorView`. Chunk
order, vector metadata, per-chunk offsets, and shared backing buffers are preserved. Interleaved and
variable-length vectors require explicit adapters and are rejected.

## Primitive multi-chunk support

The multi-chunk column means that the primitive directly accepts a `GraphVectorView` and computes
one globally correct result across its ordered `GraphDataView` chunks. A ❌ primitive still accepts
its documented atomic graph resources; callers must select, adapt, or explicitly pack chunks.

| Primitive | Primary graph input | Multi-chunk `GraphVectorView` |
| --- | --- | :---: |
| `GPUScan` | Scalar `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUCompaction` | Scalar `GraphDataView`s or matching `GraphVectorView`s | ✅ |
| `GPUMask` | Scalar masks or matching mask `GraphVectorView`s | ✅ |
| `GPUHierarchyLayout` | Parent state, child state, heights, and offsets | ❌ |
| `GPUGraphTraversal` | CSR adjacency and scalar graph data views | ❌ |
| `GPUAncestorProjection` | Source-aligned parent, mask, and output views | ❌ |
| `GPUSort` | Key and value `GraphDataView`s | ❌ |
| `GPUReduction` | Scalar `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUHistogram` | Scalar `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUGridBinning` | Position `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUGridAggregation` | Aligned position and weight views or vectors | ✅ |
| `GPUGroupAggregation` | Dense group-key view or vector with optional aligned mask | ✅ |
| `GPUIndexPickingTarget` | Texture and readback resources | ❌ |
| `DrawCommandBuffer` | Indirect command buffer | ❌ |

## Texture APIs

### `importTexture(descriptor, defaultTexture?)`

Declares a caller-owned `Texture` or ready `DynamicTexture`. Texture descriptors are exact rather
than capacity-based: format, dimension, extent, mip count, and sample count must match at every
encoding, while concrete usage must contain every declared flag. Recompile canvas-sized graphs
after a device-pixel resize.

### `createTransientTexture(descriptor)`

Declares graph-owned texture storage. Non-overlapping logical textures reuse one physical texture
when their descriptors match apart from ID and usage. The allocation is created with the union of
their usage flags.

### `createTextureView(texture, props?)`

Creates a `GraphTextureView` with normalized aspect, mip, and array-layer ranges. Texture hazards
are inferred only between overlapping ranges. Handle-level uses conservatively cover the complete
texture.

## Node APIs

- `addComputePass(node)` compiles an executable callback that receives a graph-owned `ComputePass`.
- `addRenderPass(node)` may declare graph texture `attachments`, resolve other `RenderPassProps`
  for each encoding, and receives a graph-owned `RenderPass`.
- `addCopyPass(node)` records directly on the caller's `CommandEncoder`.

Buffer nodes declare storage, uniform, copy, indirect, vertex, and index uses. Texture nodes declare
`sampled`, storage, render-attachment, and copy uses. Render attachments are automatically treated
as read-write resources. `dependsOn` adds explicit ordering where resources do not express the
dependency.

Executable contexts expose `getBuffer()`, `getTexture()`, and `getTextureView()`. Concrete texture
views and framebuffers are cached for repeated encodings and rebuilt when an imported texture is
replaced.

## Hazards and scheduling

A hazard is an ordering requirement caused by accesses to the same physical resource. The compiler
adds dependencies for read-after-write, write-after-read, and write-after-write access. Read-after-
read access does not require ordering.

Buffer hazards are tracked at `GraphBufferHandle` granularity. Consequently, distinct
`GraphDataView`s that share a handle alias even when their byte ranges do not overlap. A
`GraphVectorView` is not itself a node resource; primitives declare uses of its individual data
views, which map back to their physical buffer handles.

Texture hazards are more precise: two `GraphTextureView` uses alias only when their aspect, mip,
and array-layer ranges overlap. A `GraphTextureHandle` use covers the complete texture.

Explicit `dependsOn` edges are combined with inferred resource edges. Compilation rejects missing
dependency IDs and cycles. Independent nodes retain declaration order, making the compiled schedule
stable.

## Compilation

The compiler performs four steps:

1. Infer hazards and topologically order nodes.
2. Compute inclusive first/last use indices for every referenced transient.
3. Reuse compatible physical allocations across non-overlapping lifetimes.
4. Create physical resources and invoke node `compile` callbacks in scheduled order.

Buffer reuse grows an allocation to the maximum required capacity and unions usage flags. Texture
reuse requires equal format, extent, dimension, mip count, and sample count; usage flags are
unioned. If node compilation throws, already-created node resources and transients are destroyed
before the error is rethrown.

The implementation keeps dependencies one-directional: `gpu-command-graph-types.ts` owns shared
handles, views, node contracts, executable contexts, and statistics;
`gpu-command-graph-compiler.ts` consumes those contracts to produce a compilation; and
`gpu-command-graph.ts` owns graph construction and encoding. The compiler never imports the graph
implementation.

## `CompiledGPUCommandGraph`

### `encode(commandEncoder, options)`

Records every compiled node. `options.parameters` is forwarded to callbacks. `options.buffers` may
override imported buffers by ID if capacity and usage remain compatible. `options.textures`
overrides exact-size imported textures. It returns a `GPUCommandGraphEncoding` with synchronous
whole-graph and per-node CPU encoding statistics.

`encode()` never submits, maps, reads, or grows resources.

If the caller's encoder has a timestamp query set, compute and render passes record timestamp pairs
without changing graph code. `encoding.canReadGPUTimings` reports whether any pairs were captured.
After submitting the command buffer, `await encoding.readTimings()` explicitly reads per-node and
total GPU durations. The read is never automatic, and copy nodes remain CPU-timed until the portable
command-encoder API exposes standalone timestamp writes.

### `capabilities`

Snapshots graph-relevant adapter information: timestamp-query support, software-adapter status,
maximum buffer and storage-binding sizes, and compute invocation and dispatch limits. Applications
can report or gate advanced diagnostics without inspecting backend handles.

### `stats`

Reports node order; imported, logical, and physical buffer and texture counts; declared or estimated
bytes; combined logical and owned-transient memory; and separate buffer and texture reuse
percentages. Imported bytes describe borrowed capacity and are never counted as graph-owned memory.

### Benchmarking protocol

Performance comparisons should warm the graph, then record `encoding.stats`, optional
`readTimings()` results, and `compiled.stats` without adding readback to the normal frame loop. Use
the same adapter and viewport for each run and include:

- empty, one-row, workgroup-boundary, and immediately-over-boundary inputs;
- the trace viewer's 250,000, 1,000,000, and 4,000,000 span capacities;
- sparse and dense dependency neighborhoods;
- repeated parameter-only updates that do not recompile the graph.

Report adapter capabilities with the measurements so software and hardware results are not mixed.
CPU encode, GPU execution, logical memory, physical transient memory, and reuse percentage are
separate values and should not be collapsed into one score.

### `destroy()`

Destroys compiled node resources, cached views/framebuffers, and physical transients. Imported
buffers and textures remain caller-owned.
