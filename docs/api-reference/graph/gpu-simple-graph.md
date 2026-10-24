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
operation set supported by WebGL or promise a full GPUGraph lowering.

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
No GPGPU exports are removed or deprecated in this first phase. Dynamic input rebinding,
full GPUGraph lowering, and migration of legacy table-viewer readback adapters remain follow-ups.

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
Repeated runs use cached results; editing the input array does not update a materialized
upload. Build a new graph for new data. Uploads can issue immediate queue writes even
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
API does not yet register evaluator passes as full GPUGraph resource-aware operations.

## Inspection and composition

`compiled.nodes` is built from GPGPU's evaluator inspection snapshots, with named output
IDs and vector collection nodes added by SimpleGraph. Shared dependencies appear once,
formats come from the shared decoder, and inspection never executes or reads back GPU
work. `compiled.outputNodes` maps selected names to nodes. `operationTree` retains authored
semantic groups; fused evaluator dependencies can differ from that authored tree.

Existing `GPUSimpleGraphOperation` and `addEvaluator()` remain available for wrapping
GPGPU expressions. Semantic scalar literals/arithmetic and vector multiply-add continue
to work unchanged. The full GPUGraph semantic operations and GPGPU operation implementations
are unchanged. Dynamic rebinding, texture/render operations, and transient resource planning
remain outside this first pass.
