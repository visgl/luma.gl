# GPUSimpleGraph

`@luma.gl/graph/gpu-simple-graph` provides graph composition around existing GPGPU
operations on WebGL and WebGPU. The existing operations, expression fusion, and
materialization logic remain the implementation. Evaluator objects are a compatibility
interface; upload, copy, execution, and output storage can be expressed through the graph.

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
and scalar-element `offset`/`stride`. Typed arrays are borrowed until materialization;
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
