import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {GPUDataAnalysisExample} from '@site/src/examples';

# GPUCommandGraph

<GPUPrimitivesDocsTabs active="command-graph" />

## Overview

`GPUCommandGraph<Parameters>` declares fixed-capacity WebGPU buffer and texture resources plus
ordered compute, render, and copy nodes. `compile()` returns a `CompiledGPUCommandGraph` that owns
transient resources and node state but borrows every import. Render nodes can resolve multisampled
attachments and consume explicitly numbered, frame-scoped swapchain and external-image bindings.

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

### When to use a command graph

A command graph fits repeated, multi-pass work whose capacities and resource shapes are known even
when frame data changes. Visibility followed by compaction and indirect drawing, simulation followed
by rendering, picking followed by a bounded copy, and analysis pipelines that share intermediate
results all benefit from compiling hazards and transient lifetimes once and encoding many times.

Use direct command encoding for a one-off pass or when the complete sequence is already simple and
local. A graph does not own the frame loop, submission, presentation, application parameters, or
unbounded allocation. Its value comes from making a reusable dataflow inspectable and validating
the resource contracts between independently authored nodes.

Render targets need a stricter lifetime distinction than ordinary data textures. An offscreen
texture can remain valid across many encodings, while a canvas texture belongs to one acquired
frame and may be replaced at presentation. `importFrameTexture()` makes that boundary visible:
every encoding supplies a fresh binding with a strictly increasing frame ID. This catches stale
swapchain reuse without making the graph responsible for acquisition or presentation.

External images are even narrower than frame textures. A WebGPU `texture_external` is an opaque,
short-lived sampling snapshot of a video or camera frame—not ordinary texture storage. It cannot
be a render attachment, storage binding, copy endpoint, or source of graph-created views.
`importExternalTexture()` therefore gives it a separate sampled-only handle and requires a newly
acquired `ExternalTexture` on every numbered encoding. The application still owns playback,
source acquisition, fallback conversion, and destruction.

### Choosing a texture lifetime

The import kind communicates why a texture may be reused, replaced, or restricted:

| Texture kind | Best fit | Example |
| --- | --- | --- |
| Imported texture | Persistent caller-owned storage | An atlas, uploaded image, history buffer, or offscreen target |
| Frame texture | Newly acquired renderable storage for one numbered frame | A canvas swapchain color target or matching frame-local depth target |
| External texture | Newly acquired sampled-only media snapshot | The current video, webcam, or decoded browser media frame |
| Transient texture | Graph-owned scratch with a compile-time lifetime | An intermediate blur target or multisampled color attachment |

Use a normal imported texture when later passes need copies, storage access, mip generation, or
reuse across frames. External textures avoid an explicit media-to-texture copy but accept a narrow
sampling-only lifetime. Frame textures model presentation resources, while transients let the graph
reuse internal allocations whose logical lifetimes do not overlap.

[`GPUTextureHistory`](/docs/api-reference/experimental/gpu-primitives/gpu-texture-history) makes
the persistent case reusable: its two caller-owned textures exchange previous/current roles through
ordinary per-encoding texture overrides. No frame-scoped swapchain contract or texture-copy node is
required.

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

Imported buffers, textures, external textures, `GPUData`, and `GPUVector` chunks are borrowed. The
compiled graph owns only node-created resources, physical transients, and cached texture
views/framebuffers. Calling `destroy()` releases those owned resources and never destroys an
import.

## Extension libraries

Small algorithm libraries can implement the structural `GPUCommandGraphContributor` interface:

```ts
class GPUAlgorithm implements GPUCommandGraphContributor {
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const output = createTransientView(
      graph,
      'algorithm-output',
      'uint32',
      outputCapacity,
      Buffer.STORAGE | Buffer.INDIRECT
    );
    // Declare compute, render, or copy nodes that use output.
  }
}

new GPUAlgorithm().addToGraph(graph);
```

A contributor only declares resources and nodes. It does not compile the graph, encode commands,
submit work, or read results back. This keeps ownership and scheduling with the application and
allows independently authored contributors to compose without a runtime registry.

The exported `createTransientView()` helper creates packed, graph-owned typed storage for
fixed-width `VertexFormat` values. Variable-length `vertex-list<...>` and `value-list<...>` formats
require an explicit adapter that owns their offsets and value counts; the helper rejects them before
declaring a graph resource. Its optional usage argument replaces the default `Buffer.STORAGE` value
and must retain `Buffer.STORAGE` while adding flags such as `Buffer.INDIRECT`. Lengths must be
non-negative safe integers.

`getViewBinding()` returns the 256-byte-aligned buffer range containing a logical
`GraphDataView`. `getViewElementOffset()` returns the corresponding offset in 32-bit shader
elements. Bindable views must occupy at least one complete row inside the logical buffer and their
byte offsets must be divisible by four.

## Buffer APIs

### `importBuffer(descriptor, defaultBuffer?)`

Declares caller-owned storage. A default `Buffer` or `DynamicBuffer` may be supplied during graph
construction, or the caller may provide a compatible override to each encoding. Represent each
physical buffer with one logical handle whenever any graph access writes to it. Separate active
handles may resolve to the same physical buffer only when every access through both handles is
read-only. The same rule applies to `DynamicBuffer` wrappers and per-encoding overrides.

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

### Choosing a buffer feature

Use `importBuffer()` when the application already owns persistent storage, such as source data,
published results, or an indirect draw buffer. Use `createTransientBuffer()` for an intermediate
that exists only while this graph executes; the compiler can safely reuse its allocation after its
last scheduled use. Use `createDataView()` to describe a typed range of either kind of buffer.

Use `importGPUData()` when one table chunk is the unit of work. Use `importGPUVector()` when the
source arrived in several record batches and those boundaries matter. Importing a vector preserves
its existing buffers, offsets, ordering, and empty chunks; it does not concatenate or upload rows.
Multiple chunks backed by the same physical buffer reuse one canonical graph handle.

### Physical buffer overlap and writable aliases

Scheduling tracks buffer hazards by logical `GraphBufferHandle`, not by individual byte ranges.
Two independently imported handles that resolve to one physical buffer would therefore hide a
read-after-write or write-after-write dependency from the scheduler. Before recording any node,
each `encode()` resolves defaults, `DynamicBuffer` wrappers, and `options.buffers` replacements to
their actual physical buffers and applies these rules:

| Active graph resources | Result | Why |
| --- | --- | --- |
| Two handles share a buffer and both are read-only | Allowed | Concurrent reads cannot corrupt each other. |
| Two handles share a buffer and either has `storage-write`, `storage-read-write`, or `copy-destination` usage | Rejected before any node runs | Distinct handles cannot express the required write hazard. |
| Several views share one canonical handle, including writable views | Allowed and ordered | Every access participates in the same inferred hazard chain. |
| An otherwise duplicated import is not referenced by any graph node | Allowed | Inactive imports cannot race with graph commands. |
| An encoding override introduces writable overlap | That encoding is rejected | Compatibility is checked against current physical bindings, not just graph defaults. |

The safe pattern is to import shared storage once and derive each logical range from that handle:

```ts
const sharedStorage = graph.importBuffer(
  {id: 'shared-storage', byteLength: sharedBuffer.byteLength, usage: Buffer.STORAGE},
  sharedBuffer
);
const sourceRows = graph.createDataView(sharedStorage, {
  id: 'source-rows',
  format: 'uint32',
  length: rowCount
});
const updatedRows = graph.createDataView(sharedStorage, {
  id: 'updated-rows',
  format: 'uint32',
  length: rowCount
});

graph.addComputePass({
  id: 'update-shared-rows',
  resources: [
    {buffer: sourceRows, usage: 'storage-read'},
    {buffer: updatedRows, usage: 'storage-write'}
  ],
  compile: () => ({encode: encodeUpdatedRows})
});
```

Do not work around this check by importing the same writable physical allocation under separate
IDs. If two independently authored contributors need it, pass them the same handle or typed view.
Validation never destroys caller-owned imports; after a rejected override, the caller can retry
with distinct buffers or the original compatible defaults.

## Primitive multi-chunk support

The multi-chunk column means that the primitive directly accepts a `GraphVectorView` and computes
one globally correct result across its ordered `GraphDataView` chunks. A ❌ primitive still accepts
its documented atomic graph resources; callers must select, adapt, or explicitly pack chunks.

| Primitive | Primary graph input | Multi-chunk `GraphVectorView` |
| --- | --- | :---: |
| `GPUScan` | Scalar `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUCompaction` | Scalar `GraphDataView`s or matching `GraphVectorView`s | ✅ |
| `GPUMask` | Scalar masks or matching mask `GraphVectorView`s | ✅ |
| `GPUHierarchyLayout` | Parent state, child state, heights, and offsets | ✅ |
| `GPUGraphTraversal` | Packed CSR or aligned local CSR partitions with global neighbor IDs | ✅ |
| `GPUAncestorProjection` | Source-aligned parent, mask, and output views | ❌ |
| `GPUSort` | Key and value `GraphDataView`s | ❌ |
| `GPUReduction` | Scalar `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUHistogram` | Scalar `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUGridBinning` | Position `GraphDataView` or `GraphVectorView` | ✅ |
| `GPUGridAggregation` | Aligned position and weight views or vectors | ✅ |
| `GPUGroupAggregation` | Dense group-key view or vector with optional aligned mask | ✅ |
| `GPUHashIndex` | One packed unsigned-key `GraphDataView` | ❌ |
| `GPUBatchHashIndex` | Ordered unsigned-key chunks and optional aligned values or validity | ✅ |
| `GPUHashIndexQuery` | One packed left-key `GraphDataView` and a shared hash index | ❌ |
| `GPUHashJoin` | One packed left-key `GraphDataView` and a shared hash index | ❌ |
| `GPUBatchHashJoin` | Ordered left-key chunks and a shared single- or multi-batch right index | ✅ |
| `GPUIndexPickingTarget` | Texture and readback resources | ❌ |
| `DrawCommandBuffer` | Indirect command buffer | ❌ |

## Texture APIs

### `importTexture(descriptor, defaultTexture?)`

Declares a caller-owned `Texture` or ready `DynamicTexture`. Texture descriptors are exact rather
than capacity-based: format, dimension, extent, mip count, and sample count must match at every
encoding, while concrete usage must contain every declared flag. Recompile canvas-sized graphs
after a device-pixel resize. Separate active imported handles cannot resolve to the same physical
texture when either handle writes. Read-only aliases remain valid.

### Retained texture history without copies

[`GPUTextureHistory`](/docs/api-reference/experimental/gpu-primitives/gpu-texture-history) owns
exactly two descriptor-identical textures. Import their initial roles once, compile the graph, and
replace both role bindings when encoding later frames:

```ts
import {Texture} from '@luma.gl/core';
import {GPUCommandGraph, GPUTextureHistory} from '@luma.gl/experimental';

const descriptor = {
  format: 'rgba16float' as const,
  width,
  height,
  usage: Texture.SAMPLE | Texture.STORAGE
};
const history = new GPUTextureHistory(device, {id: 'radiance', ...descriptor});
const graph = new GPUCommandGraph(device, {id: 'temporal-renderer'});
const previous = graph.importTexture(
  {id: 'previous-radiance', ...descriptor},
  history.previousTexture
);
const current = graph.importTexture(
  {id: 'current-radiance', ...descriptor},
  history.currentTexture
);

graph.addComputePass({
  id: 'accumulate-radiance',
  resources: [
    {texture: previous, usage: 'sampled'},
    {texture: current, usage: 'storage-write'}
  ],
  compile: ({device}) => createAccumulationExecutable(device, previous, current)
});

const compiled = graph.compile();
compiled.encode(commandEncoder, {
  parameters: undefined,
  textures: history.getBindings('previous-radiance', 'current-radiance')
});
history.advance();
```

Advance roles only after encoding succeeds. The application still owns encoder submission, and a
failed encoding leaves both physical roles unchanged. Cached graph views recognize the alternating
physical textures; graph destruction releases those views but never destroys the borrowed history
textures. Destroy or replace the history explicitly when its descriptor changes.

History textures are persistent `importTexture()` resources, not `importFrameTexture()` resources.
The latter represents fresh presentation attachments and intentionally rejects reuse across frame
IDs. `reset()` restores the original role order but does not clear either texture; shaders must
explicitly invalidate stale samples after a camera cut, topology change, or resize.

### Physical texture overlap and writable aliases

Texture hazard inference tracks views belonging to one logical `GraphTextureHandle`. Importing the
same physical texture twice under separate handles would hide cross-handle write hazards, even if
one binding is supplied through an encoding override or numbered frame texture. Before recording any
node, `encode()` resolves the concrete textures and applies these rules:

| Active imported resources | Result |
| --- | --- |
| Two handles share a physical texture and both are read-only | Allowed. |
| Two handles share a physical texture and either declares `storage-write`, `storage-read-write`, `render-attachment`, or `copy-destination` | Rejected before recording any node. |
| Multiple texture views share one canonical imported handle | Allowed; overlapping ranges participate in inferred texture hazards. |
| A duplicate import is unused by all graph nodes | Allowed. |
| A persistent override or frame binding introduces writable overlap | Only that encoding is rejected; corrected bindings can be retried. |

Import writable shared storage once and derive all mip, layer, or aspect ranges from that canonical
handle with `createTextureView()`. Retained-history previous/current roles must resolve to two
different physical textures on every encoding.

### `importFrameTexture(descriptor)`

Declares a borrowed texture with no persistent default. Each encoding supplies
`frameTextures[id] = {texture, frameId}`. All frame textures in one encoding must use the same
non-negative frame ID, and that ID must increase on every later encoding of the compiled graph.

This contract is intended for swapchain color attachments and any matching frame-local depth or
resolve resources. The application acquires the textures before encoding and presents them after
submission. The graph validates exact descriptor compatibility and ownership, but never acquires,
presents, treats an earlier frame binding as reusable, or destroys the imported texture.

### `importExternalTexture(descriptor)`

Declares a frame-scoped, sampled-only external image with fixed width and height. Each encoding
supplies `externalTextures[id] = {texture, frameId}`. The frame ID must be non-negative, strictly
increase for that handle, and match every `frameTextures` and `externalTextures` binding supplied
to the same encoding. The concrete `ExternalTexture` wrapper must also be fresh; incrementing the
frame ID cannot make an earlier opaque browser binding valid again.

Only render nodes may declare `{externalTexture, usage: 'sampled'}`. Executables resolve the current
snapshot with `getExternalTexture(handle)`. This intentionally rules out views, copies, storage,
attachments, transient allocation, and implicit conversion. Use a normal `Texture` import when a
workflow needs those operations.

```ts
const video = graph.importExternalTexture({id: 'video', width, height});

graph.addRenderPass({
  id: 'sample-video',
  resources: [{externalTexture: video, usage: 'sampled'}],
  compile: () => ({
    encode: ({renderPass, getExternalTexture}) => {
      model.setBindings({videoTexture: getExternalTexture(video)});
      model.draw(renderPass);
    }
  })
});

const externalTexture = device.createExternalTexture({source: videoElement});
compiled.encode(device.commandEncoder, {
  parameters,
  externalTextures: {video: {texture: externalTexture, frameId}}
});
```

Acquire the concrete binding immediately before encoding. Media clocks and decoder queues stay
outside the graph, and a WebGL or reusable-storage path should copy the source into a normal
texture explicitly.

### `createTransientTexture(descriptor)`

Declares graph-owned texture storage. Non-overlapping logical textures reuse one physical texture
when their descriptors match apart from ID and usage. The allocation is created with the union of
their usage flags.

### `createTextureView(texture, props?)`

Creates a `GraphTextureView` with normalized aspect, mip, and array-layer ranges. Texture hazards
are inferred only between overlapping ranges. Handle-level uses conservatively cover the complete
texture.

## Render attachments and resolves

`addRenderPass()` accepts graph-managed color and depth/stencil views. A multisampled color view
can provide a corresponding single-sample entry in `resolveTargets`:

```ts
graph.addRenderPass({
  id: 'render-msaa',
  attachments: {
    colorAttachments: [multisampledColor],
    resolveTargets: [frameColor],
    depthStencilAttachment: multisampledDepth
  },
  compile: () => renderExecutable
});
```

Resolve arrays have one entry per color attachment; `null` skips a slot. Every non-null target
must match its source format, extent, mip, layer, and aspect, use one sample, and resolve a source
with more than one sample. Source, depth, and other render attachments retain matching sample
counts. Resolve targets participate in ordinary graph hazards, so later sampling or copying is
ordered after the render pass.

Multisample resolve is currently a WebGPU contract. Render-pass callbacks cannot also supply their
own framebuffer or resolve targets when graph attachments are present.

## Node APIs and graph commands

A graph command is a reusable description of GPU work, not a second command queue or a hidden
submission API. `compile()` prepares node executables once; `encode(commandEncoder, options)`
records them into the application's existing `CommandEncoder`; the application decides when to
submit that encoder. This distinction lets analytics, rendering, and explicitly requested
readback share one dependency-ordered execution without taking ownership of the frame loop.

| Feature | Why it exists | Typical use |
| --- | --- | --- |
| `addComputePass()` | Schedule shader dispatch alongside its declared buffer and texture hazards. | Filtering, scans, sorting, hash-index construction, aggregation, and indirect-command generation. |
| `addRenderPass()` | Schedule drawing with graph-managed attachments, resolves, and sampled resources. | Scene rendering, picking, off-screen layers, and multisampled frame composition. |
| `addCopyPass()` | Express transfers or encoder-level operations in the same ordered graph. | Explicit compact-result readback, staging uploads, and copying finished render targets. |
| `dependsOn` | Describe an ordering requirement that no shared graph resource can express. | External side effects, timestamp boundaries, and application-owned synchronization. |
| Repeated `encode()` | Reuse compiled pipelines and scratch allocations with new parameters or imports. | Interactive filters, animation frames, changing selections, and reusable query plans. |

### `addComputePass(node)`

Use a compute node whenever a shader reads or writes resources that other graph features consume.
The graph manages the `ComputePass`; the executable only records dispatch commands. Consecutive
compute nodes normally share one physical pass, preserving their individual execution order and
debug groups without paying repeated pass-management overhead. A render or copy node always closes
the active compute pass before recording its own commands. Declaring every input as `storage-read`
and every output as `storage-write` lets later compute, render, or copy nodes automatically wait
for the produced data.

```ts
graph.addComputePass({
  id: 'select-visible-rows',
  resources: [
    {buffer: inputRows, usage: 'storage-read'},
    {buffer: visibilityMask, usage: 'storage-write'}
  ],
  compile: ({device}) => createVisibilityExecutable(device)
});
```

Primitives such as `GPUBatchHashIndex`, `GPUScan`, and `GPUHashJoin` use this same public graph
contract: `primitive.addToGraph(graph)` contributes compute nodes but does not compile, submit, or
read back the graph on the application's behalf.

### `addRenderPass(node)`

Use a render node when graph-produced buffers or textures feed a draw, or when a draw produces a
texture consumed by a later pass. Declare sampled and vertex inputs normally and supply graph-owned
`attachments` when the graph should resolve the framebuffer. Multisampled attachments can provide
`resolveTargets`; attachment writes then participate in ordinary texture hazard ordering.

```ts
graph.addRenderPass({
  id: 'draw-visible-instances',
  resources: [{buffer: visibleRows, usage: 'vertex'}],
  attachments: {colorAttachments: [frameColor]},
  compile: () => ({encode: encodeVisibleInstances})
});
```

The graph owns the `RenderPass` lifecycle. The executable records drawing commands; it must not
end the pass, submit the encoder, or replace a graph-managed framebuffer.

### `addCopyPass(node)`

Use a copy node when an operation belongs directly on the application's `CommandEncoder`, such as
copying one small summary into an explicitly requested readback buffer. Copying is never implied by
graph execution: an application that keeps all results GPU-resident should not add a readback
node. Declare the source and destination so transfers are ordered after producers and before
subsequent consumers.

```ts
graph.addCopyPass({
  id: 'copy-result-summary',
  resources: [
    {buffer: resultSummary, usage: 'copy-source'},
    {buffer: readbackSummary, usage: 'copy-destination'}
  ],
  compile: () => ({encode: encodeSummaryCopy})
});
```

### Explicit dependencies and repeated encodings

Prefer declared resource uses because they explain both ordering and transient lifetimes. Add
`dependsOn: ['upstream-node-id']` only when an application-visible dependency has no corresponding
buffer or texture hazard. Compile the complete graph once, then supply fresh parameters or
compatible imported buffers and textures through later `encode()` calls. Writable physical-buffer
and physical-texture overlap are revalidated for every encoding before any node records work.

Buffer nodes declare storage, uniform, copy, indirect, vertex, and index uses. Texture nodes declare
`sampled`, storage, render-attachment, and copy uses. Render attachments are automatically treated
as read-write resources. `dependsOn` adds explicit ordering where resources do not express the
dependency.

Executable contexts expose `getBuffer()`, `getTexture()`, `getTextureView()`, and
`getExternalTexture()`. Concrete ordinary texture views and framebuffers are cached for repeated
encodings and rebuilt when an imported texture is replaced. Non-default views over frame-scoped
ordinary textures are refreshed for each frame ID; external textures never enter either cache.

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

Defaults, `DynamicBuffer` and `DynamicTexture` wrappers, per-encoding replacements, and numbered
frame-texture bindings must not introduce writable aliases between separate active logical handles.
Read-only aliases remain valid. All resource validation occurs before the first node executes.

`encode()` never submits, maps, reads, or grows resources.

Consecutive compute nodes share one physical compute pass by default. Node order, resource hazards,
debug groups, and individual CPU measurements remain unchanged; render and copy nodes form strict
pass boundaries. Set `options.coalesceComputePasses` to `false` when separate passes are required.
`encoding.stats.computePassCount` reports the actual number of physical compute passes, and
`encoding.stats.coalescedComputeNodeCount` reports how many nodes reused an already-open pass.

`options.frameTextures` and `options.externalTextures` form one coherent frame transaction. The
graph validates every binding before advancing its remembered frame IDs, so a rejected replacement
can be corrected and retried without partially consuming a frame.

If the caller's encoder has a timestamp query set, compute and render passes record timestamp pairs
without changing graph code. Compute-pass coalescing is automatically disabled for that encoding
so every compute node retains its own GPU timestamp pair. `encoding.canReadGPUTimings` reports
whether any pairs were captured. After submitting the command buffer, `await
encoding.readTimings()` explicitly reads per-node and total GPU durations. The read is never
automatic, and copy nodes remain CPU-timed until the portable command-encoder API exposes
standalone timestamp writes.

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
buffers, textures, and external-image bindings remain caller-owned.

## `GPUCommandGraphInspector`

`GPUCommandGraphInspector` is a data-only collector for one or more compiled graphs. Its non-owning
observation handle registers a graph and records synchronous CPU measurements whenever encoding is
routed through the handle. Optional GPU timestamp readback remains explicit and happens only after
the caller submits the command buffer:

```ts
import {GPUCommandGraphInspector} from '@luma.gl/experimental';

const inspector = new GPUCommandGraphInspector({maxSamples: 120});
const observation = inspector.observeGraph(compiled);

const commandEncoder = device.createCommandEncoder();
const encoding = observation.encode(commandEncoder, {parameters: {time}});
device.submit(commandEncoder.finish());

if (encoding.canReadGPUTimings) {
  await observation.recordGPUTimings(encoding);
}

// The application remains responsible for any diagnostic-buffer readback.
observation.recordCounters({candidates, matches});

const snapshot = inspector.getSnapshot();
observation.detach();
```

`getSnapshot()` returns an immutable view of every registered graph in registration order. Each
graph snapshot includes its compile-time `stats` and `capabilities`, encoding and failed-timing-read
counts, bounded whole-graph CPU and GPU duration summaries, application-defined scalar counter
summaries, and per-node summaries in compiled schedule order. Duration and counter summaries contain
the retained sample count plus latest, p50, and p95 values. Counters remain in first-observed order.
Pass `getNodeGroup` to the constructor to add application-specific semantic groups to node snapshots;
pass `maxSamples` to bound every retained history.

The inspector does not submit commands, poll frames, render a panel, or read GPU timestamps
automatically. An observation does not own or destroy its graph. `detach()` stops that observation
and removes its registration when it is still current; an old handle cannot remove a replacement
with the same graph ID or publish delayed counters into it. A handle accepts timing reads only for
encodings it produced and records at most one GPU sample per encoding. `recordCounters()` only
stores caller-provided finite, non-negative values; it does not read a buffer or synchronize the
device. `clear()` removes all registrations. The lower-level `registerGraph()`, `recordEncoding()`,
`recordGPUTimings()`, and `recordCounters()` methods remain available for applications that cannot
route graph activity through an observation handle.
