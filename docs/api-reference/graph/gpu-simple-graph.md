# GPUSimpleGraph

`@luma.gl/graph/gpu-simple-graph` provides portable expression and transfer execution and the lazy evaluator
API on WebGL and WebGPU. Evaluator operations and their fusion/caching behavior remain available.

## Choose an authoring mode

| Mode | Authoring and compilation | Result ownership |
| --- | --- | --- |
| Reusable named operations | `new GPUSimpleGraph()`, `addInput()`, shared expression/upload/copy operations, `compile(device)` | Allocated results returned by `run()` belong to the caller |
| Evaluator-backed recipes | `new GPUSimpleGraph(device)`, `addValue()` or upload/copy operations, `compile()` | Generated recipe results belong to the compiled graph |

Use reusable expressions when supplying new input vectors on each run. Use evaluator recipes
for the broader evaluator operation set and lazy materialization. Do not mix the modes in one
graph. The reusable path rejects state and custom full-graph lowerings; the evaluator path
rejects declaration-based inputs/state. `GPUGraph` has a separate WebGPU execution implementation.

## Reusable declaration-based expressions

Use `addInput(name, gpuGraph.scalar(...))` or `addInput(name, gpuGraph.vector(...))`
to declare external inputs, add a
[`GPUExpressionOperation`](./gpu-expression-operation.md), and call `compile(device)`.
Expressions and shared [upload/copy operations](./gpu-transfer-operations.md) infer their results; callers need not declare intermediates.
Supply actual inputs with `compiled.run({inputs})`. Vector lengths can change between runs.
See [Graph inputs, results, and state](./gpu-graph-values.md); state execution remains full-graph only.
The expression reference documents the shared interface with `GPUGraph`, supported syntax,
and caller-owned output results. The evaluator-based APIs below remain available unchanged.

## Evaluator-backed graph values

Evaluator recipes can use graph values instead of directly constructing evaluators:

```typescript
import {
  GPUSimpleGraph, GPUSimpleGraphValue, simpleGraphOperations
} from '@luma.gl/graph/gpu-simple-graph';

const input = GPUSimpleGraphValue.upload(new Float32Array([1, 2, 3]));
const output = simpleGraphOperations.add(simpleGraphOperations.multiply(input, 2), 1);
const graph = new GPUSimpleGraph(device);
graph.addValue('output', output);
const compiled = graph.compile();
const results = await compiled.run(); // results.output is a GPUVector
// Consume results.output on the GPU; readback is explicit.
compiled.destroy(); // after all consumers finish
```

`GPUSimpleGraphValue.upload(data, options)` describes a CPU input. `constant(value)`
describes a scalar or vector literal. `fromGPUData(chunk)` borrows an existing GPU chunk.
`simpleGraphOperations` exposes the existing GPGPU arithmetic, dot, length, extent,
fround, gather, interleave, equalAll, select, sequence, segmentedMap, swizzle, castData,
and convertColorData functions with graph-value operands. Their arguments, output layouts,
backend support, and numerical behavior are unchanged. These recipes do not extend the
operation set supported by WebGL or promise a full GPUCommandGraph lowering.

`graph.addValue(name, value)` publishes a named output and returns the same value.
A shared value is lowered once per compilation; reuse across compiled graphs creates
independent execution state. Compilation creates internal evaluators without GPU allocation.
The compiled graph owns the entire generated evaluator tree, including literal and fused
operation dependencies. It borrows external GPU buffers. Graph values need no `destroy()`;
keep input arrays and buffers alive until their consumers finish. Results owned by the
compiled graph become invalid when it is destroyed. Do not mutate recipes after authoring.

For chunked vectors, supply an ordered array of graph values. Mapping is explicit, so
reductions remain per chunk and the API never silently repacks or merges chunks:

```typescript
const chunks = inputVector.data.map(chunk =>
  simpleGraphOperations.multiply(GPUSimpleGraphValue.fromGPUData(chunk), 2)
);
graph.addValue('scaled', chunks);
```

Use `new GPUSimpleGraphValueOperation({id, value})` when composing with operation arrays
or shared composite groups. `compiled.outputs` and `addEvaluator()` remain compatibility
interfaces for existing evaluator users; new consumers use the GPUVectors returned by `run()`.
Evaluator exports remain supported. Evaluator recipes can invalidate changed input contents
and rebind render resources without rebuilding; changing evaluator input layouts still requires
a new compilation. Use reusable expression mode for per-run named input bindings.

## Evaluator recipe upload and copy

For reusable `compile(device)` graphs, use the shared [GPUUploadOperation and GPUCopyOperation](./gpu-transfer-operations.md). The following operations belong to the older evaluator recipe mode.

```typescript
import {
  GPUSimpleGraph,
  GPUSimpleGraphUploadOperation,
  GPUSimpleGraphCopyOperation
} from '@luma.gl/graph/gpu-simple-graph';

const graph = new GPUSimpleGraph(device).add([
  new GPUSimpleGraphUploadOperation({
    id: 'input', data: new Float32Array([1, 2, 3]), size: 1
  }),
  new GPUSimpleGraphCopyOperation({id: 'result', input: 'input'})
]);
const compiled = graph.compile({outputs: ['result']});
const {result} = await compiled.run(); // GPUVector, no CPU readback
// After all consumers finish:
compiled.destroy();
```

Upload inputs use the existing array layout rules: optional `type`, `size`, `normalized`,
and byte `offset`/`stride`. Typed arrays are borrowed until materialization;
plain arrays are converted during compilation. Compilation allocates no GPU storage.
Repeated runs use cached results. After editing a borrowed typed array, call
`compiled.invalidate([inputId])` before the next run. Plain arrays are copied at compilation;
rebuild for changes to those arrays or to the input layout. Uploads can issue immediate queue writes even
inside a scope; cancellation does not undo those writes.

Copy inputs name an earlier operation's output. Copies preserve stored bytes and chunk
boundaries, use independent output storage, and perform no CPU readback. WebGPU requires
`COPY_SRC` on source buffers, `COPY_DST` on destinations, and four-byte aligned copy offsets
and sizes. Contiguous rows use one copy; strided rows use one copy per row. Unsupported
unaligned copies fail explicitly. Copies to the same buffer are unsupported in this pass.

## Borrowed output storage

```typescript
const compiled = graph.compile({
  outputs: ['result'],
  outputTargets: {
    result: {buffer: destination, byteOffset: 16, byteStride: 8}
  }
});
```

Targets address selected output names. A vector with several chunks takes an ordered
array of targets, one per chunk. Offsets and strides are in bytes. Targets must belong
to the graph device and be large enough for the result. A target stride must fit one row.

This first pass adds a final copy into each target, reusing the evaluator's existing
borrowed-target support. It preserves borrowed input evaluators and their caches; it
does not promise direct computation into the target or eliminate intermediate allocations.
Destroying the compiled graph releases its internal results but never destroys caller-owned
target buffers or explicitly wrapped evaluators. Keep targets alive until all GPU consumers
finish. Overlapping writes to shared targets are the caller's responsibility.

## Scoped execution on WebGPU

```typescript
import {GPUEvaluationScope} from '@luma.gl/graph/gpu-simple-graph';

const scope = new GPUEvaluationScope(device);
try {
  const first = await firstCompiled.run({scope});
  const second = await secondCompiled.run({scope});
  // Append consumers to scope.commandEncoder using first/second's GPUVector chunks.
  scope.submit();
} finally {
  scope.cancel(); // Discards pending work; harmless after submission.
}
```

Await each run before starting another scoped operation. Scope and graph devices must
match. A compiled graph remains retained until submission or cancellation: running it
again or destroying it during that interval fails. Returned resources are available for
commands on the same encoder but must not be read back or consumed elsewhere before
submission. A failed run cancels the scope, including earlier graphs recorded in it.
Cancellation invalidates newly materialized results and restores output targets for retry;
previously cached results are preserved. Caller-owned raw buffers remain the caller's
lifetime responsibility.

`run()` without a scope retains immediate evaluation and caching behavior. Scoped runs
require WebGPU and opted-in operation handlers. `capabilities.callerControlledSubmission`
indicates device support; it does not guarantee every operation supports scopes. This
API does not yet register evaluator passes as full GPUCommandGraph resource-aware operations.

## Inspection and composition

`compiled.nodes` is built from GPGPU's evaluator inspection snapshots, with named output
IDs and vector collection nodes added by SimpleGraph. Shared dependencies appear once,
formats come from the shared decoder, and inspection never executes or reads back GPU
work. `compiled.outputNodes` maps selected names to nodes. `operationTree` retains authored
semantic groups; fused evaluator dependencies can differ from that authored tree.

Existing `GPUSimpleGraphOperation` and `addEvaluator()` remain available for wrapping
GPGPU expressions. Semantic scalar literals/arithmetic and vector multiply-add continue
to work unchanged. The full GPUGraph semantic operations and GPGPU operation implementations
are unchanged. Render operations use the shared graph resource planner described below;
evaluator storage and operation selection retain their existing implementation.

## Shared render operations

These passes use evaluator recipe mode: construct `new GPUSimpleGraph(device)` and call
`compile()` without a device argument. Reusable `compile(device)` expression graphs keep their
existing CPU/GPU input, transfer and execution contracts. Render primitives can also contribute
their passes to `GPUCommandGraph`.

`GPURenderOperation` (from `@luma.gl/graph/gpu-core`) contributes ordinary graph render
nodes. Add it to a SimpleGraph with `graph.add(operation)`, or add the same operation
to a WebGPU `GPUCommandGraph` or an authored `GPUGraph`. Its factory is called for each compilation;
create logical resources in the factory and shaders/models in each node's `compile`
callback. The full graph sees each pass and its declared resource accesses, rather
than an opaque operation that submits another graph.

```typescript
const clear = new GPURenderOperation({
  id: 'clear',
  createNodes: graph => {
    const target = graph.importTexture({
      id: 'target', format: 'rgba8unorm', width: 256, height: 256,
      usage: Texture.RENDER
    }, outputTexture);
    return [{
      type: 'render', id: 'clear-target',
      attachments: {colorAttachments: [graph.createTextureView(target)]},
      compile: () => ({
        getRenderPassProps: () => ({clearColor: [0, 0, 0, 1]}),
        encode: () => {}
      })
    }];
  }
});
simpleGraph.add(clear);
const compiled = simpleGraph.compile();
compiled.runSync(); // WebGL; asynchronous run() also supports WebGPU
```

Declare sampled textures and buffer reads/writes in `resources`. Attachment writes
are inferred from `attachments`. The shared graph compiler validates usage, views,
and hazards, allocates transient textures, and owns framebuffers and compiled node
state. Imported buffers and textures remain caller-owned. Destroy the compiled
SimpleGraph after its work is no longer in use; its `renderGraph` exposes the usual
resource statistics, preflight metadata, and inspection APIs. Transient textures
may alias when lifetimes do not overlap; publish persistent results into imports.

In this first pass, render operations follow all evaluator operations. Adding
an evaluator operation after a render operation is rejected. Use explicit output
buffer targets to connect evaluator results to render inputs. `runSync()` supports
WebGL evaluators that already have synchronous execution; it does not read data back.
WebGL passes execute immediately. On WebGPU, `run({scope})` appends render passes
to the same evaluation scope encoder and leaves submission to the caller.

Only the render primitive is portable to the full graph: evaluator execution is
still a SimpleGraph phase. `GPUCommandGraph` continues to require WebGPU. This API does not
promise WebGL compute, storage textures, indirect dispatch, or multisample resolves.

WebGL sampled textures must use the full default view. Selected mip/layer ranges are
rejected because WebGL sampler bindings cannot represent those texture views. Render
attachments may still select supported individual mip levels and layers.

Before the first synchronous evaluator run, eagerly register its backend, for example
`await backendRegistry.add('webgl', import('@luma.gl/graph/gpu-simple-graph/webgl'))` using
`backendRegistry` from `@luma.gl/graph/gpu-simple-graph`. Synchronous execution cannot wait for lazy
backend imports. Render-only graphs do not need evaluator backend registration.

## Input invalidation

Publish an input with `addValue('positions', GPUSimpleGraphValue.upload(typedArray))`
or `GPUSimpleGraphValue.fromGPUData(chunk)`, then reference that value from your
expressions. After changing the original typed array or writing to the borrowed GPU
buffer, call `compiled.invalidate(['positions'])`. The next run recomputes only the
reachable dependent results. Unrelated cached outputs keep their existing buffers.
External semantic vector bindings are addressable by their GPUGraph input IDs too.

Invalidation accepts named leaf inputs owned by the compilation, including chunked
inputs. Compilation rejects duplicate input names across uploads and semantic bindings. It rejects unknown names, intermediate expressions, and borrowed legacy
evaluators without changing their caches. Calls are forbidden during a run or while
an evaluation scope is pending. Input lengths, formats, chunk boundaries, and layouts
remain fixed; rebuild the graph to change them. Empty invalidation lists do nothing.

`outputTargets` keep their borrowed buffer identity and layout across invalidation.
Internal cached allocations may be recycled, so consumers must finish using previous
results before invalidating them and obtain fresh result views from the next run.
No readback or data comparison is performed to detect changes automatically.

## Per-run render bindings and parameters

Render inputs use the same `buffers`, `textures`, and `parameters` fields as full
graph encoding. Resource replacement is per invocation and addressed by logical
resource ID; omitted bindings revert to their imported defaults. The shared graph
validates device, capacity, usage, texture layout, and physical aliasing. These
bindings affect render passes, not evaluator input vectors or `outputTargets`.

```typescript
const graph = new GPUSimpleGraph<{weightsChanged: boolean}>(device);
const operation = new GPURenderOperation<{weightsChanged: boolean}>({
  id: 'aggregate',
  createNodes: resources => {
    // Import buffers/textures and construct ordinary render nodes here.
    // A node may use the existing CPU condition contract:
    // condition: {id: 'weights-dirty', source: 'cpu',
    //   evaluate: parameters => parameters.weightsChanged}
    return createAggregationRenderNodes(resources);
  }
});
graph.add(operation);
const compiled = graph.compile();
await compiled.run({
  parameters: {weightsChanged: true},
  buffers: {weights: weightBuffer},
  textures: {bins: binTexture}
});
```

Typed parameters are required when the graph declares a non-void parameter type.
A `GPURenderOperation` without an explicit parameter type is parameter-independent
(`unknown`) and can be mixed with parameterized passes in either graph API.
`add()` checks render-operation parameter types through inferred arrays and shared
`composite()` / `GPUCompositeOperation` groups. Keep the inferred group type rather
than widening it to the general `GPUOperation` interface, which erases that information.
WebGL `runSync(options)` accepts the same bindings and parameters. Conditions are
explicit: rebinding a resource does not automatically mark a channel dirty. A skipped
producer must leave valid data for any consumer that still runs. Use imported storage
for persistent channel results; transient allocation lifetimes do not promise that
skipped-pass results survive reuse by other passes.

The same parameterized `GPURenderOperation` can be added to a compatible full WebGPU
graph. No deck.gl migration is part of this API change.

## CPU callbacks and dynamically sized results

Reusable SimpleGraph programs accept `GPUCPUOperation`, imported from `@luma.gl/graph`.
The same operation also runs in `GPUGraph` on WebGPU. SimpleGraph supports CPU execution
through `new GPUSimpleGraph().compile(device)`; evaluator recipes are not supported.

```typescript
import {GPUCPUOperation, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

const graph = new GPUSimpleGraph();
graph.addInput('positions', gpuGraph.vector('float32x2'));
graph.add(new GPUCPUOperation({
  id: 'tessellate',
  inputs: {positions: 'positions'},
  outputs: {
    meshPositions: gpuGraph.vector('float32x2'),
    meshIndices: gpuGraph.vector('uint32')
  },
  async execute({inputs}) {
    const positions = inputs.positions;
    if (typeof positions === 'number') throw new Error('Expected vector');
    const mesh = await tessellate(positions.pack()); // Application-provided CPU algorithm.
    return {meshPositions: mesh.positions, meshIndices: mesh.indices};
  }
}));
graph.add(new GPUExpressionOperation({output: 'scaled', expression: 'meshPositions * 2'}));
const compiled = graph.compile(device, {outputs: ['scaled', 'meshIndices']});
const results = await compiled.run({inputs: {positions: positionsVector}});
```

Callbacks receive numeric scalars or CPU vector snapshots with `format`, `length`, and
`chunks`. Each chunk has `values` and `length`. Readback preserves source chunks;
`pack()` explicitly combines them into a new array. Treat input arrays as read-only.

Each named output returns a packed `Float32Array`, `Uint32Array`, or `Int32Array`, or
`{chunks: [{values: typedArray}, ...]}` to specify chunk boundaries. Array types must match
formats. Complete rows are required: six float32 components in `float32x2` represent
three rows. Empty arrays are supported. Optional descriptor `length` and `chunkLengths`
constraints are checked. Formats are fixed at compilation; lengths can change on every run.
Only the portable 32-bit numeric formats with one to four components are supported.

The executor awaits the callback and retains CPU results until a GPU consumer or selected GPU output requires upload. Do not mutate returned arrays until `run()` settles. CPU callbacks can delegate to
workers through promises; closures are not automatically moved to workers. CPU-to-CPU chains retain their results in CPU memory without GPU transfers.

CPU boundaries submit preceding GPU work before readback. These programs do not support
`prepare()`, caller-controlled scopes, textures, state, or `outputTargets`. Use `addInput()`
for external inputs. Every authored operation executes in order on each run, without caching.
Selected results transfer to the caller; intermediates are released after the run, including
on failure. Inputs remain borrowed. A failed callback does not prevent a later run.

## CPU coordinate projection

`CPUProjectionOperation` from `@luma.gl/graph/gpu-project` accepts `{id, input, output,
format, projection}`. Supply `float32x2` or `float32x3` and a prepared projection from
`projectionEngine.createProjectionAsync()` in `@math.gl/geospatial/projection`.
The operation preserves row counts and chunk boundaries, copies input arrays before
projection, and lets the executor upload the results. Forward projection follows the
prepared transform's axis and height conventions. Prepare a reversed CRS pair for inverse
projection. Input and output storage use Float32 precision. Projection errors reject the run.

`CPUData` and `CPUVector`, exported by `@luma.gl/graph/gpu-data`, provide borrowed CPU
storage with the same memory format strings as GPUVector. CPUData accepts a buffer or view,
format, length, and optional byte layout, flattened value count, list offsets, and validity
bitmap. Byte offsets are relative to the supplied view; the stored byteOffset is absolute
within its underlying buffer. CPUVector contains ordered CPUData chunks. Construction does
not copy payloads or combine chunks; mutations of borrowed memory remain visible. CPU memory
is garbage-collected and has no destroy method. These storage types do not yet integrate with
graph bindings, automatic transfers, nested lists, or Arrow schemas.
