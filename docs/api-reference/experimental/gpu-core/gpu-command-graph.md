# GPUCommandGraph

[Command Graph](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md)[Texture History](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-texture-history.md)[Readback Ring](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/docs/api-reference/experimental/gpu-core/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUCommandGraph<Parameters>` declares fixed-capacity WebGPU buffer and texture resources plus ordered compute, render, and copy nodes. `compile()` returns a `CompiledGPUCommandGraph` that owns transient resources and node state but borrows every import. Render nodes can resolve multisampled attachments and consume explicitly numbered, frame-scoped swapchain and external-image bindings.

See [Choosing a GPU Data-Processing API](https://luma.gl/docs/api-guide/gpu/gpu-data-processing.md) for guidance on when to use a command graph, portable GPGPU evaluators, or lower-level compute helpers.

## At a glance

| Question                 | Answer                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Problem**              | Compose reusable compute, copy, and render work into one validated execution plan.        |
| **Reads / writes**       | Nodes declare every logical resource range they read or write.                            |
| **Ownership**            | Imports remain caller-owned; compiled graphs own transients and node-created state.       |
| **Output contract**      | Immutable topology and capacities with per-encoding parameters and compatible imports.    |
| **Expected work**        | Node estimates report logical nodes, physical passes, commands, bytes, and invocations.   |
| **Chunks**               | Graph vectors preserve ordered chunks; each contributor documents its support.            |
| **Conditions / budgets** | CPU predicates, GPU indirect conditions, and resumable execution plans are first-class.   |
| **Neighborhood**         | application resources and contributors → GPUCommandGraph → caller encoder and submission. |

**Cost**Compilation is reusable; recompile only when topology, capacities, formats, or requirements change.

**Common mistake**Do not encode, submit, or map hidden work inside a contributor.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use a command graph for repeated multi-pass GPU work whose capacities and resource shapes are known while frame parameters and imported resources change. Visibility plus compaction and indirect drawing, simulation plus rendering, and GPU analysis pipelines are representative workloads.

Use direct command encoding for a one-off pass or a sequence that is already simple and local. A command graph does not own submission, presentation, the frame loop, or unbounded allocation. See [Execution and composition](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md) for the mental model, terminology, hazard scheduling, conditions, resumable work, budgets, and instrumentation.

## Quick usage[​](#quick-usage "Direct link to Quick usage")

This example composes reduction, histogram, and grid-binning nodes in one reusable graph:

Scroll page · Ctrl/⌘ + scroll to interact

```
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

## Lifecycle and ownership[​](#lifecycle-and-ownership "Direct link to Lifecycle and ownership")

A graph definition is mutable until `compile()` is called. Compilation freezes the definition, infers a stable node order, plans transient allocation reuse, creates physical transients, and calls each node's `compile` callback once. The returned `CompiledGPUCommandGraph` can then be encoded repeatedly with different parameters and compatible imported-resource replacements.

Imported buffers, textures, external textures, `GPUData`, and `GPUVector` chunks are borrowed. The compiled graph owns only node-created resources, physical transients, and cached texture views/framebuffers. Calling `destroy()` releases those owned resources and never destroys an import.

## Extension libraries[​](#extension-libraries "Direct link to Extension libraries")

Small algorithm libraries can implement the structural `GPUCommandGraphContributor` interface:

```
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

A contributor only declares resources and nodes. It does not compile the graph, encode commands, submit work, or read results back. This keeps ownership and scheduling with the application and allows independently authored contributors to compose without a runtime registry.

The exported `createTransientView()` helper creates packed, graph-owned typed storage for fixed-width `VertexFormat` values. Variable-length `vertex-list<...>` and `value-list<...>` formats require an explicit adapter that owns their offsets and value counts; the helper rejects them before declaring a graph resource. Its optional usage argument replaces the default `Buffer.STORAGE` value and must retain `Buffer.STORAGE` while adding flags such as `Buffer.INDIRECT`. Lengths must be non-negative safe integers.

`getViewBinding()` returns the 256-byte-aligned buffer range containing a logical `GraphDataView`. `getViewElementOffset()` returns the corresponding offset in 32-bit shader elements. Bindable views must occupy at least one complete row inside the logical buffer and their byte offsets must be divisible by four.

## Buffer APIs[​](#buffer-apis "Direct link to Buffer APIs")

### `importBuffer(descriptor, defaultBuffer?)`[​](#importbufferdescriptor-defaultbuffer "Direct link to importbufferdescriptor-defaultbuffer")

Declares caller-owned storage. A default `Buffer` or `DynamicBuffer` may be supplied during graph construction, or the caller may provide a compatible override to each encoding. Represent each physical buffer with one logical handle whenever any graph access writes to it. Separate active handles may resolve to the same physical buffer only when every access through both handles is read-only. The same rule applies to `DynamicBuffer` wrappers and per-encoding overrides.

### `createTransientBuffer(descriptor)`[​](#createtransientbufferdescriptor "Direct link to createtransientbufferdescriptor")

Declares graph-owned scratch storage. Compatible logical transients with non-overlapping lifetimes may share one physical buffer.

### `createDataView(handle, props)`[​](#createdataviewhandle-props "Direct link to createdataviewhandle-props")

Creates a `GraphDataView<T extends GPUVectorFormat>` with `format`, `length`, `byteOffset`, `byteStride`, and `rowByteLength` metadata.

### `importGPUData(id, data)`[​](#importgpudataid-data "Direct link to importgpudataid-data")

Imports the backing allocation and preserves the supplied `GPUData` range.

### `importGPUVector(id, vector)`[​](#importgpuvectorid-vector "Direct link to importgpuvectorid-vector")

Imports every fixed-width `GPUData` chunk without packing and returns a `GraphVectorView`. Chunk order, vector metadata, per-chunk offsets, and shared backing buffers are preserved. Interleaved and variable-length vectors require explicit adapters and are rejected.

### Choosing a buffer feature[​](#choosing-a-buffer-feature "Direct link to Choosing a buffer feature")

Use `importBuffer()` when the application already owns persistent storage, such as source data, published results, or an indirect draw buffer. Use `createTransientBuffer()` for an intermediate that exists only while this graph executes; the compiler can safely reuse its allocation after its last scheduled use. Use `createDataView()` to describe a typed range of either kind of buffer.

Use `importGPUData()` when one table chunk is the unit of work. Use `importGPUVector()` when the source arrived in several record batches and those boundaries matter. Importing a vector preserves its existing buffers, offsets, ordering, and empty chunks; it does not concatenate or upload rows. Multiple chunks backed by the same physical buffer reuse one canonical graph handle.

### Physical buffer overlap and writable aliases[​](#physical-buffer-overlap-and-writable-aliases "Direct link to Physical buffer overlap and writable aliases")

Scheduling tracks buffer hazards by logical `GraphBufferHandle`, not by individual byte ranges. Two independently imported handles that resolve to one physical buffer would therefore hide a read-after-write or write-after-write dependency from the scheduler. Before recording any node, each `encode()` resolves defaults, `DynamicBuffer` wrappers, and `options.buffers` replacements to their actual physical buffers and applies these rules:

| Active graph resources                                                                                       | Result                          | Why                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Two handles share a buffer and both are read-only                                                            | Allowed                         | Concurrent reads cannot corrupt each other.                                                                                       |
| Two handles share a buffer and either has `storage-write`, `storage-read-write`, or `copy-destination` usage | Rejected before any node runs   | Distinct handles cannot express the required write hazard.                                                                        |
| Several views share one canonical handle across different nodes                                              | Allowed and ordered             | Every access participates in the same inferred hazard chain.                                                                      |
| One shader node declares overlapping storage-binding ranges and either is writable                           | Rejected when the node is added | WebGPU forbids writable binding aliases inside one shader pass, including views that overlap only after binding-offset alignment. |
| An otherwise duplicated import is not referenced by any graph node                                           | Allowed                         | Inactive imports cannot race with graph commands.                                                                                 |
| An encoding override introduces writable overlap                                                             | That encoding is rejected       | Compatibility is checked against current physical bindings, not just graph defaults.                                              |

The safe pattern is to import shared storage once and derive each logical range from that handle:

```
const sharedStorage = graph.importBuffer(

  {id: 'shared-storage', byteLength: sharedBuffer.byteLength, usage: Buffer.STORAGE},

  sharedBuffer

);

const rows = graph.createDataView(sharedStorage, {format: 'uint32', length: rowCount});



graph.addComputePass({

  id: 'update-shared-rows',

  resources: [{buffer: rows, usage: 'storage-read-write'}],

  compile: () => ({encode: encodeUpdatedRows})

});
```

Do not work around this check by importing the same writable physical allocation under separate IDs. If two independently authored contributors need it, pass them the same handle or typed view. When one shader needs distinct input and output bindings in a shared allocation, their aligned binding ranges must not overlap; otherwise expose the shared range through one read-write binding. Validation never destroys caller-owned imports; after a rejected override, the caller can retry with distinct buffers or the original compatible defaults.

## Primitive multi-chunk support[​](#primitive-multi-chunk-support "Direct link to Primitive multi-chunk support")

The multi-chunk column means that the primitive directly accepts a `GraphVectorView` and computes one globally correct result across its ordered `GraphDataView` chunks. A ❌ primitive still accepts its documented atomic graph resources; callers must select, adapt, or explicitly pack chunks.

| Primitive               | Primary graph input                                                     | Multi-chunk `GraphVectorView` |
| ----------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| `GPUScan`               | Scalar `GraphDataView` or `GraphVectorView`                             | ✅                            |
| `GPUCompaction`         | Scalar `GraphDataView`s or matching `GraphVectorView`s                  | ✅                            |
| `GPUMask`               | Scalar masks or matching mask `GraphVectorView`s                        | ✅                            |
| `GPUHierarchyLayout`    | Parent state, child state, heights, and offsets                         | ✅                            |
| `GPUGraphTraversal`     | Packed CSR or aligned local CSR partitions with global neighbor IDs     | ✅                            |
| `GPUAncestorProjection` | Source-aligned parent, mask, and output views                           | ❌                            |
| `GPUSort`               | Key and value `GraphDataView`s                                          | ❌                            |
| `GPUReduction`          | Scalar `GraphDataView` or `GraphVectorView`                             | ✅                            |
| `GPUHistogram`          | Scalar `GraphDataView` or `GraphVectorView`                             | ✅                            |
| `GPUGridBinning`        | Position `GraphDataView` or `GraphVectorView`                           | ✅                            |
| `GPUGridAggregation`    | Aligned position and weight views or vectors                            | ✅                            |
| `GPUGroupAggregation`   | Dense group-key view or vector with optional aligned mask               | ✅                            |
| `GPUHashIndex`          | One packed unsigned-key `GraphDataView`                                 | ❌                            |
| `GPUBatchHashIndex`     | Ordered unsigned-key chunks and optional aligned values or validity     | ✅                            |
| `GPUHashIndexQuery`     | One packed left-key `GraphDataView` and a shared hash index             | ❌                            |
| `GPUHashJoin`           | One packed left-key `GraphDataView` and a shared hash index             | ❌                            |
| `GPUBatchHashJoin`      | Ordered left-key chunks and a shared single- or multi-batch right index | ✅                            |
| `GPUIndexPickingTarget` | Texture and readback resources                                          | ❌                            |
| `DrawCommandBuffer`     | Indirect command buffer                                                 | ❌                            |

## Texture APIs[​](#texture-apis "Direct link to Texture APIs")

### `importTexture(descriptor, defaultTexture?)`[​](#importtexturedescriptor-defaulttexture "Direct link to importtexturedescriptor-defaulttexture")

Declares a caller-owned `Texture` or ready `DynamicTexture`. Texture descriptors are exact rather than capacity-based: format, dimension, extent, mip count, and sample count must match at every encoding, while concrete usage must contain every declared flag. Recompile canvas-sized graphs after a device-pixel resize. Separate active imported handles cannot resolve to the same physical texture when either handle writes. Read-only aliases remain valid.

### Retained texture history without copies[​](#retained-texture-history-without-copies "Direct link to Retained texture history without copies")

[`GPUTextureHistory`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-texture-history.md) owns exactly two descriptor-identical textures. Import their initial roles once, compile the graph, and replace both role bindings when encoding later frames:

```
import {Texture} from '@luma.gl/core';

import {GPUCommandGraph, GPUTextureHistory} from '@luma.gl/gpgpu/gpu-core';



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

Advance roles only after encoding succeeds. The application still owns encoder submission, and a failed encoding leaves both physical roles unchanged. Cached graph views recognize the alternating physical textures; graph destruction releases those views but never destroys the borrowed history textures. Destroy or replace the history explicitly when its descriptor changes.

History textures are persistent `importTexture()` resources, not `importFrameTexture()` resources. The latter represents fresh presentation attachments and intentionally rejects reuse across frame IDs. `reset()` restores the original role order but does not clear either texture; shaders must explicitly invalidate stale samples after a camera cut, topology change, or resize.

### Physical texture overlap and writable aliases[​](#physical-texture-overlap-and-writable-aliases "Direct link to Physical texture overlap and writable aliases")

Texture hazard inference tracks views belonging to one logical `GraphTextureHandle`. Importing the same physical texture twice under separate handles would hide cross-handle write hazards, even if one binding is supplied through an encoding override or numbered frame texture. Before recording any node, `encode()` resolves the concrete textures and applies these rules:

| Active imported resources                                                                                                                  | Result                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Two handles share a physical texture and both are read-only                                                                                | Allowed.                                                             |
| Two handles share a physical texture and either declares `storage-write`, `storage-read-write`, `render-attachment`, or `copy-destination` | Rejected before recording any node.                                  |
| Multiple texture views share one canonical imported handle                                                                                 | Allowed; overlapping ranges participate in inferred texture hazards. |
| A duplicate import is unused by all graph nodes                                                                                            | Allowed.                                                             |
| A persistent override or frame binding introduces writable overlap                                                                         | Only that encoding is rejected; corrected bindings can be retried.   |

Import writable shared storage once and derive all mip, layer, or aspect ranges from that canonical handle with `createTextureView()`. Retained-history previous/current roles must resolve to two different physical textures on every encoding.

### `importFrameTexture(descriptor)`[​](#importframetexturedescriptor "Direct link to importframetexturedescriptor")

Declares a borrowed texture with no persistent default. Each encoding supplies `frameTextures[id] = {texture, frameId}`. All frame textures in one encoding must use the same non-negative frame ID, and that ID must increase on every later encoding of the compiled graph.

This contract is intended for swapchain color attachments and any matching frame-local depth or resolve resources. The application acquires the textures before encoding and presents them after submission. The graph validates exact descriptor compatibility and ownership, but never acquires, presents, treats an earlier frame binding as reusable, or destroys the imported texture.

### `importExternalTexture(descriptor)`[​](#importexternaltexturedescriptor "Direct link to importexternaltexturedescriptor")

Declares a frame-scoped, sampled-only external image with fixed width and height. Each encoding supplies `externalTextures[id] = {texture, frameId}`. The frame ID must be non-negative, strictly increase for that handle, and match every `frameTextures` and `externalTextures` binding supplied to the same encoding. The concrete `ExternalTexture` wrapper must also be fresh; incrementing the frame ID cannot make an earlier opaque browser binding valid again.

Only render nodes may declare `{externalTexture, usage: 'sampled'}`. Executables resolve the current snapshot with `getExternalTexture(handle)`. This intentionally rules out views, copies, storage, attachments, transient allocation, and implicit conversion. Use a normal `Texture` import when a workflow needs those operations.

```
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

Acquire the concrete binding immediately before encoding. Media clocks and decoder queues stay outside the graph, and a WebGL or reusable-storage path should copy the source into a normal texture explicitly.

### `createTransientTexture(descriptor)`[​](#createtransienttexturedescriptor "Direct link to createtransienttexturedescriptor")

Declares graph-owned texture storage. Non-overlapping logical textures reuse one physical texture when their descriptors match apart from ID and usage. The allocation is created with the union of their usage flags.

### `createTextureView(texture, props?)`[​](#createtextureviewtexture-props "Direct link to createtextureviewtexture-props")

Creates a `GraphTextureView` with normalized aspect, mip, and array-layer ranges. Texture hazards are inferred only between overlapping ranges. Handle-level uses conservatively cover the complete texture.

## Render attachments and resolves[​](#render-attachments-and-resolves "Direct link to Render attachments and resolves")

`addRenderPass()` accepts graph-managed color and depth/stencil views. A multisampled color view can provide a corresponding single-sample entry in `resolveTargets`:

```
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

Resolve arrays have one entry per color attachment; `null` skips a slot. Every non-null target must match its source format, extent, mip, layer, and aspect, use one sample, and resolve a source with more than one sample. Source, depth, and other render attachments retain matching sample counts. Resolve targets participate in ordinary graph hazards, so later sampling or copying is ordered after the render pass.

Multisample resolve is currently a WebGPU contract. Render-pass callbacks cannot also supply their own framebuffer or resolve targets when graph attachments are present.

### Caller-owned per-encoding framebuffers[​](#caller-owned-per-encoding-framebuffers "Direct link to Caller-owned per-encoding framebuffers")

A render node without graph-managed `attachments` can select an existing application framebuffer through its compiled executable's `getRenderPassProps()` callback:

```
const graph = new GPUCommandGraph<{framebuffer: Framebuffer}>(device);



graph.addRenderPass({

  id: 'present-offscreen',

  resources: [{texture: tracedImage, usage: 'sampled'}],

  compile: () => ({

    getRenderPassProps: ({parameters}) => ({framebuffer: parameters.framebuffer}),

    encode: ({renderPass}) => model.draw(renderPass)

  })

});



const compiled = graph.compile();

compiled.encode(commandEncoder, {parameters: {framebuffer: firstTarget}});

compiled.encode(otherCommandEncoder, {parameters: {framebuffer: secondTarget}});
```

Changing the compatible framebuffer does not recompile the graph, and both framebuffers remain caller-owned. The graph still opens and closes the render pass; acquiring or destroying the framebuffer and submitting each command encoder remain the application's responsibilities. Render pipelines must match the selected target's color and depth/stencil formats, so callers should recreate incompatible pipelines when those formats change.

Because an application-provided framebuffer is not a declared graph resource, the graph cannot infer hazards for its attachment textures or order later nodes that sample them. Import the target texture and declare graph-managed `attachments` when later work in the same graph depends on its output. A node cannot combine graph-managed attachments with a callback-provided framebuffer.

## Node APIs and graph commands[​](#node-apis-and-graph-commands "Direct link to Node APIs and graph commands")

A graph command is a reusable description of GPU work, not a second command queue or a hidden submission API. `compile()` prepares node executables once; `encode(commandEncoder, options)` records them into the application's existing `CommandEncoder`; the application decides when to submit that encoder. This distinction lets analytics, rendering, and explicitly requested readback share one dependency-ordered execution without taking ownership of the frame loop.

| Feature             | Why it exists                                                                            | Typical use                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `addComputePass()`  | Schedule shader dispatch alongside its declared buffer and texture hazards.              | Filtering, scans, sorting, hash-index construction, aggregation, and indirect-command generation. |
| `addRenderPass()`   | Schedule drawing with graph-managed attachments or compatible caller-owned framebuffers. | Scene rendering, picking, off-screen layers, and multisampled frame composition.                  |
| `addCopyPass()`     | Express transfers or encoder-level operations in the same ordered graph.                 | Explicit compact-result readback, staging uploads, and copying finished render targets.           |
| `dependsOn`         | Describe an ordering requirement that no shared graph resource can express.              | External side effects, timestamp boundaries, and application-owned synchronization.               |
| Repeated `encode()` | Reuse compiled pipelines and scratch allocations with new parameters or imports.         | Interactive filters, animation frames, changing selections, and reusable query plans.             |
| `createExecution()` | Advance one graph invocation through bounded dependency-ordered submissions.             | Large aggregations, index builds, and background analysis that must not monopolize a frame.       |

### Budgeted execution across frames[​](#budgeted-execution-across-frames "Direct link to Budgeted execution across frames")

`compiled.createExecution({maximumInvocationCount})` creates a resumable cursor over one graph invocation. Budgets can additionally cap nodes, commands, bytes read, and bytes written per submission. Each `encodeNext()` call records the next contiguous dependency-ordered range fitting all supplied limits. The graph still does not own submission or animation scheduling: applications submit one returned step when their frame loop admits background work.

```
const budget = {

  maximumInvocationCount: 262_144,

  maximumReadByteLength: 16 * 1024 * 1024,

  maximumWriteByteLength: 8 * 1024 * 1024

};

const executionOptions = {

  latencyPriority: 'background' as const,

  publicationPolicy: 'progressive' as const

};

const plan = compiled.getExecutionPlan(budget, executionOptions);

if (plan.oversizedStepCount > 0) {

  showWarning(`${plan.oversizedStepCount} indivisible operations exceed the frame budget`);

}

const execution = compiled.createExecution(budget, executionOptions);



function encodeBackgroundStep(): void {

  const commandEncoder = device.createCommandEncoder();

  const step = execution.encodeNext(commandEncoder, {parameters});

  device.submit(commandEncoder.finish());

  if (!step.completed) requestAnimationFrame(encodeBackgroundStep);

}
```

`getExecutionPlan()` is a dry run: it returns immutable step boundaries, complete static cost totals, and an oversized-step count before commands enter the GPU queue. This lets an application explain expensive work, lower its budget, or require confirmation without speculative execution. Progress from `encodeNext()` is based on planned submissions, so it remains stable when nodes have very different costs.

Every execution carries an explicit `interactive`, `normal`, or `background` latency priority. The graph exposes it on the immutable plan and every returned step so an application scheduler can arbitrate several ready executions without guessing from graph IDs. Priority does not reorder nodes or bypass dependencies.

Nodes are the atomic scheduling unit. An operation that may span frames should contribute bounded partition nodes—typically initialization, independently sized accumulation partitions, and finalization—and annotate invocation, command, read-byte, and write-byte bounds. Queue submission order preserves buffer dependencies between steps. A node larger than any requested budget is encoded by itself so execution always makes progress, and its step reports `exceedsBudget: true`. Intermediate outputs remain application-private until the cursor reports completion by default.

### Controlled partial publication[​](#controlled-partial-publication "Direct link to Controlled partial publication")

A node may declare a coherent result boundary with `publication: {id, completeness}`. With the default `publicationPolicy: 'final'`, these boundaries do not alter execution and only complete graph output is publishable. With `publicationPolicy: 'progressive'`, the planner closes a step at each declared boundary. After that command buffer completes on the GPU queue, `step.publishable` is true and `step.publications` identifies the application results that are safe to consume.

```
graph.addCopyPass({

  id: 'summary-ready',

  resources: [{buffer: summary, usage: 'storage-read'}],

  publication: {id: 'summary', completeness: 'partial'},

  compile: () => ({encode: () => {}})

});
```

The resource read makes the coherence boundary depend on all prior summary writes, and later writes depend on the boundary. A publication node may encode real copy work or be a no-command boundary as above. The application must still wait for submitted work before reading or presenting the result. `execution.publishedProgress` advances only at safe boundaries; ordinary encoding progress can continue independently.

### Measured budget feedback[​](#measured-budget-feedback "Direct link to Measured budget feedback")

`GPUCommandGraphExecutionBudgetController` calibrates the next execution from measured queue-completion time. It scales every configured budget dimension together, preventing a faster invocation target from silently violating command or memory-traffic constraints. Tail steps are normalized by their consumed fraction of the current budget, so a small final partition does not incorrectly inflate the next execution.

```
const controller = new GPUCommandGraphExecutionBudgetController({

  initialBudget: budget,

  latencyPriority: 'interactive'

});



const execution = compiled.createExecution(controller.budget);

while (!execution.completed) {

  const encoder = device.createCommandEncoder();

  const step = execution.encodeNext(encoder, {parameters});

  const startTime = performance.now();

  device.submit(encoder.finish());

  await device.handle.queue.onSubmittedWorkDone();

  controller.observeStep(step, performance.now() - startTime, execution.budget);

}
```

An execution plan remains immutable after creation: timing feedback affects later graph executions, not work already encoded or submitted. Passing the execution's original budget keeps every step's saturation measurement tied to the plan that produced it even while the controller learns a future budget. Applications should normally keep separate controllers for operations with different kernels, such as index construction, aggregation, and causal traversal.

Latency priority supplies a queue-time target of 4 ms for `interactive`, 8 ms for `normal`, or 16 ms for `background`. `targetStepMilliseconds` remains available as an explicit override. The controller uses measurements to tune later immutable plans toward that target.

### Adapter-local kernel autotuning[​](#adapter-local-kernel-autotuning "Direct link to Adapter-local kernel autotuning")

Execution budgets answer “how much work belongs in one submission?” `GPUCommandGraphAutotuner` answers the separate question “which equivalent kernel should do that work on this adapter?” Create one tuner for the device and share it across graphs:

```
const adapter = getGPUCommandGraphAdapterIdentity(device);

const autotuner = new GPUCommandGraphAutotuner({

  adapter,

  profile: loadApplicationProfile(adapter.key)

});

const graph = new GPUCommandGraph(device, {autotuner});



const selection = autotuner.selectKernel({

  operation: 'GPUScan',

  workloadSize: rowCount,

  candidates: [

    {id: 'subgroups', supported: device.features.has('subgroups')},

    {id: 'portable'}

  ]

});
```

Selection is deterministic. Each supported variant is explored until `minimumSampleCount` samples exist in the current power-of-two workload bucket. Later decisions use the lowest estimated GPU duration, falling back to the nearest measured bucket when an exact bucket is unavailable. Setting `explorationEnabled: false` makes uncalibrated choices use candidate order.

Annotate equivalent nodes so one timing report can update the profile:

```
graph.addComputePass({

  id: 'scan-level-0',

  workload: {

    operation: 'GPUScan',

    variant: selection.variant,

    maximumInvocationCount: rowCount

  },

  resources,

  compile: compileSelectedScan(selection.variant)

});



const report = await inspectorObservation.recordGPUTimings(encoding);

if (report) {

  autotuner.observeTimingReport(report, compiled.preflight);

  saveApplicationProfile(autotuner.exportProfile());

}
```

`exportProfile()` returns JSON-safe adapter identity and timing aggregates. The application decides whether to keep it in memory, persist it, or discard it. A profile with a different adapter key is ignored. GPU Core performs no browser-storage access, and observations affect only graphs compiled after the next selection decision; an already compiled graph never changes kernels underneath an execution.

### `addComputePass(node)`[​](#addcomputepassnode "Direct link to addcomputepassnode")

Use a compute node whenever a shader reads or writes resources that other graph features consume. The graph manages the `ComputePass`; the executable only records dispatch commands. Consecutive compute nodes normally share one physical pass, preserving their individual execution order and debug groups without paying repeated pass-management overhead. A render or copy node always closes the active compute pass before recording its own commands. Declaring every input as `storage-read` and every output as `storage-write` lets later compute, render, or copy nodes automatically wait for the produced data.

```
graph.addComputePass({

  id: 'select-visible-rows',

  resources: [

    {buffer: inputRows, usage: 'storage-read'},

    {buffer: visibilityMask, usage: 'storage-write'}

  ],

  compile: ({device}) => createVisibilityExecutable(device)

});
```

Primitives such as `GPUBatchHashIndex`, `GPUScan`, and `GPUHashJoin` use this same public graph contract: `primitive.addToGraph(graph)` contributes compute nodes but does not compile, submit, or read back the graph on the application's behalf.

### `addRenderPass(node)`[​](#addrenderpassnode "Direct link to addrenderpassnode")

Use a render node when graph-produced buffers or textures feed a draw, or when a draw produces a texture consumed by a later pass. Declare sampled and vertex inputs normally and supply graph-owned `attachments` when the graph should resolve the framebuffer. Multisampled attachments can provide `resolveTargets`; attachment writes then participate in ordinary texture hazard ordering.

```
graph.addRenderPass({

  id: 'draw-visible-instances',

  resources: [{buffer: visibleRows, usage: 'vertex'}],

  attachments: {colorAttachments: [frameColor]},

  compile: () => ({encode: encodeVisibleInstances})

});
```

The graph owns the `RenderPass` lifecycle. The executable records drawing commands; it must not end the pass, submit the encoder, or replace a graph-managed framebuffer. When no `attachments` are declared, `getRenderPassProps()` may choose a compatible caller-owned framebuffer for each encoding.

### `addCopyPass(node)`[​](#addcopypassnode "Direct link to addcopypassnode")

Use a copy node when an operation belongs directly on the application's `CommandEncoder`, such as copying one small summary into an explicitly requested readback buffer. Copying is never implied by graph execution: an application that keeps all results GPU-resident should not add a readback node. Declare the source and destination so transfers are ordered after producers and before subsequent consumers.

```
graph.addCopyPass({

  id: 'copy-result-summary',

  resources: [

    {buffer: resultSummary, usage: 'copy-source'},

    {buffer: readbackSummary, usage: 'copy-destination'}

  ],

  compile: () => ({encode: encodeSummaryCopy})

});
```

### Explicit dependencies and repeated encodings[​](#explicit-dependencies-and-repeated-encodings "Direct link to Explicit dependencies and repeated encodings")

Prefer declared resource uses because they explain both ordering and transient lifetimes. Add `dependsOn: ['upstream-node-id']` only when an application-visible dependency has no corresponding buffer or texture hazard. Compile the complete graph once, then supply fresh parameters or compatible imported buffers and textures through later `encode()` calls. Writable physical-buffer and physical-texture overlap are revalidated for every encoding before any node records work.

Buffer nodes declare storage, uniform, copy, indirect, vertex, and index uses. Texture nodes declare `sampled`, storage, render-attachment, and copy uses. Render attachments are automatically treated as read-write resources. `dependsOn` adds explicit ordering where resources do not express the dependency.

Executable contexts expose `getBuffer()`, `getTexture()`, `getTextureView()`, and `getExternalTexture()`. Concrete ordinary texture views and framebuffers are cached for repeated encodings and rebuilt when an imported texture is replaced. Non-default views over frame-scoped ordinary textures are refreshed for each frame ID; external textures never enter either cache.

## `CompiledGPUCommandGraph`[​](#compiledgpucommandgraph "Direct link to compiledgpucommandgraph")

### `encode(commandEncoder, options)`[​](#encodecommandencoder-options "Direct link to encodecommandencoder-options")

Records every compiled node. `options.parameters` is forwarded to callbacks. `options.buffers` may override imported buffers by ID if capacity and usage remain compatible. `options.textures` overrides exact-size imported textures. It returns a `GPUCommandGraphEncoding` with synchronous whole-graph and per-node CPU encoding statistics.

Defaults, `DynamicBuffer` and `DynamicTexture` wrappers, per-encoding replacements, and numbered frame-texture bindings must not introduce writable aliases between separate active logical handles. Read-only aliases remain valid. All resource validation occurs before the first node executes.

`encode()` never submits, maps, reads, or grows resources.

Consecutive compute nodes share one physical compute pass by default. Node order, resource hazards, debug groups, and individual CPU measurements remain unchanged; render and copy nodes form strict pass boundaries. Set `options.coalesceComputePasses` to `false` when separate passes are required. `encoding.stats.computePassCount` reports the actual number of physical compute passes, and `encoding.stats.coalescedComputeNodeCount` reports how many nodes reused an already-open pass.

`options.frameTextures` and `options.externalTextures` form one coherent frame transaction. The graph validates every binding before advancing its remembered frame IDs, so a rejected replacement can be corrected and retried without partially consuming a frame.

If the caller's encoder has a timestamp query set, compute and render passes record timestamp pairs without changing graph code. Compute-pass coalescing is automatically disabled for that encoding so every compute node retains its own GPU timestamp pair. `encoding.canReadGPUTimings` reports whether any pairs were captured. After submitting the command buffer, `await encoding.readTimings()` explicitly reads per-node and total GPU durations. The read is never automatic, and copy nodes remain CPU-timed until the portable command-encoder API exposes standalone timestamp writes.

### `capabilities`[​](#capabilities "Direct link to capabilities")

Snapshots graph-relevant adapter information: timestamp-query support, software-adapter status, maximum buffer and storage-binding sizes, and compute invocation and dispatch limits. Applications can report or gate advanced diagnostics without inspecting backend handles.

### `stats`[​](#stats "Direct link to stats")

Reports node order; imported, logical, and physical buffer and texture counts; declared or estimated bytes; combined logical and owned-transient memory; and separate buffer and texture reuse percentages. Imported bytes describe borrowed capacity and are never counted as graph-owned memory.

### Benchmarking protocol[​](#benchmarking-protocol "Direct link to Benchmarking protocol")

Performance comparisons should warm the graph, then record `encoding.stats`, optional `readTimings()` results, and `compiled.stats` without adding readback to the normal frame loop. Use the same adapter and viewport for each run and include:

* empty, one-row, workgroup-boundary, and immediately-over-boundary inputs;
* the trace viewer's 250,000, 1,000,000, and 4,000,000 span capacities;
* sparse and dense dependency neighborhoods;
* repeated parameter-only updates that do not recompile the graph.

Report adapter capabilities with the measurements so software and hardware results are not mixed. CPU encode, GPU execution, logical memory, physical transient memory, and reuse percentage are separate values and should not be collapsed into one score.

### `destroy()`[​](#destroy "Direct link to destroy")

Destroys compiled node resources, cached views/framebuffers, and physical transients. Imported buffers, textures, and external-image bindings remain caller-owned.

## `GPUCommandGraphInspector`[​](#gpucommandgraphinspector "Direct link to gpucommandgraphinspector")

`GPUCommandGraphInspector` is a data-only collector for one or more compiled graphs. Its non-owning observation handle registers a graph and records synchronous CPU measurements whenever encoding is routed through the handle. Optional GPU timestamp readback remains explicit and happens only after the caller submits the command buffer:

```
import {GPUCommandGraphInspector} from '@luma.gl/gpgpu/gpu-core';



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

`getSnapshot()` returns an immutable view of every registered graph in registration order. Each graph snapshot includes its compile-time `stats` and `capabilities`, encoding and failed-timing-read counts, bounded whole-graph CPU and GPU duration summaries, application-defined scalar counter summaries, and per-node summaries in compiled schedule order. Duration and counter summaries contain the retained sample count plus latest, p50, and p95 values. Counters remain in first-observed order. Pass `getNodeGroup` to the constructor to add application-specific semantic groups to node snapshots; pass `maxSamples` to bound every retained history.

The inspector does not submit commands, poll frames, render a panel, or read GPU timestamps automatically. An observation does not own or destroy its graph. `detach()` stops that observation and removes its registration when it is still current; an old handle cannot remove a replacement with the same graph ID or publish delayed counters into it. A handle accepts timing reads only for encodings it produced and records at most one GPU sample per encoding. `recordCounters()` only stores caller-provided finite, non-negative values; it does not read a buffer or synchronize the device. `clear()` removes all registrations. The lower-level `registerGraph()`, `recordEncoding()`, `recordGPUTimings()`, and `recordCounters()` methods remain available for applications that cannot route graph activity through an observation handle.
