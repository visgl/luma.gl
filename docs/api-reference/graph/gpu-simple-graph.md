# GPUSimpleGraph

`@luma.gl/graph/gpu-simple-graph` provides graph composition around existing GPGPU
operations on WebGL and WebGPU. The existing operations, expression fusion, and
materialization logic remain the implementation. Evaluator objects are a compatibility
interface; upload, copy, execution, and output storage can be expressed through the graph.

## Author expressions with graph values

New code can use graph values instead of constructing or managing evaluators:

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
No GPGPU exports are removed or deprecated in this first phase. Replacing evaluator input
layouts, full GPUGraph lowering of evaluator recipes, and migration of legacy table-viewer
readback adapters remain follow-ups.

## Upload and copy

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
import {GPUEvaluationScope} from '@luma.gl/gpgpu';

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
`await backendRegistry.add('webgl', import('@luma.gl/gpgpu/operations/webgl'))` using
`backendRegistry` from `@luma.gl/gpgpu`. Synchronous execution cannot wait for lazy
backend imports. Render-only graphs do not need evaluator backend registration.

## Input invalidation

Publish an input with `addValue('positions', GPUSimpleGraphValue.upload(typedArray))`
or `GPUSimpleGraphValue.fromGPUData(chunk)`, then reference that value from your
expressions. After changing the original typed array or writing to the borrowed GPU
buffer, call `compiled.invalidate(['positions'])`. The next run recomputes only the
reachable dependent results. Unrelated cached outputs keep their existing buffers.
External semantic vector bindings are addressable by their GPUProgram input IDs too.

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
