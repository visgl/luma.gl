# GPUSimpleGraph

A thin evaluator-backed executor using GPUOperation metadata and GPUCompositeOperation grouping. Import it from `@luma.gl/gpu-graph/gpu-simple-graph`.

`GPUSimpleGraphOperation` implements the shared semantic operation interface. Its evaluator still owns execution, fusion, caching, backend selection, and results. GPGPU needs no changes for this adapter.

```typescript
import {GPUDataEvaluator, multiply} from '@luma.gl/gpgpu';
import {GPUProgram, composite} from '@luma.gl/gpu-graph/gpu-core';
import {GPUSimpleGraph, GPUSimpleGraphOperation} from '@luma.gl/gpu-graph/gpu-simple-graph';

const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1});
const output = multiply(input, 2);
const operations = composite([
  new GPUSimpleGraphOperation({id: 'input', evaluator: input}),
  new GPUSimpleGraphOperation({id: 'output', evaluator: output})
], {id: 'scale'});

// Both containers accept and inspect the same semantic grouping.
const program = new GPUProgram().add(operations);
const graph = new GPUSimpleGraph(device).add([operations]);
const compiled = graph.compile({outputs: ['output']});
console.log(program.operationTree, compiled.operationTree);
const {output: result} = await compiled.run();
// result is a GPUVector; CPU readback remains explicit.
```

## Existing semantic operations

SimpleGraph executes the existing `GPUProgramScalarLiteral` and `GPUProgramVectorMADD`
operations without changing their definitions or the full graph compiler:

```typescript
import {
  GPUProgram, GPUProgramScalarLiteral, GPUProgramVectorMADD
} from '@luma.gl/gpu-graph/gpu-core';

const program = new GPUProgram();
const input = program.vector('input', 'float32', inputVector.length, {external: true});
const output = program.vector('output', 'float32', inputVector.length);
const scale = program.scalar('scale', 'float32');
program.add([
  new GPUProgramScalarLiteral({output: scale, value: 2}),
  new GPUProgramVectorMADD({input, scale, addend: input, output})
]);
const bindings = {vectors: {input: inputVector}};
const compiled = new GPUSimpleGraph(device).add(program.operations).compile({
  bindings, outputs: ['output']
});
const result = await compiled.run();
// Use result.output; destroy only after consumers have finished with its storage.
compiled.destroy();
```

The same program and bindings can be passed to `GPUProgramCompiler.compile(program, bindings)`.
Bindings use its existing `GPUProgramBindings` type: vectors, GPUData chunks, or arrays of chunks.
Semantic outputs are selected by logical value ID, not operation ID.

This initial subset supports float32, nonempty chunk lists, matching input/addend chunk
partitions, and single-assignment internal outputs. Define scalars and intermediate vectors before
using them. It rejects missing bindings, incompatible shapes/formats, output aliases, repeated
writes, and conditional/loop composites. It does not implicitly repack inputs.

Compiled graphs own evaluator adapters and results created for semantic operations; `destroy()`
releases those resources. Input buffers and explicitly supplied evaluator wrappers remain borrowed.

## Composition and lifecycle

- `add(operation)` accepts GPUSimpleGraphOperation, the semantic subset above, ordinary shared composites, and nested arrays. It returns the graph. Unsupported semantic operations and command producers are rejected before registration.
- `addEvaluator(id, evaluator)` wraps and registers an evaluator, returning it unchanged for convenient expression composition.
- `compile({outputs})` freezes the builder, including when compilation fails. Rebuilding requires a new graph. The default output is the last leaf output (a logical value ID for semantic operations).
- Compilation allocates no GPU resources. It captures selected evaluator operations as an execution plan; `run()` evaluates those roots, allowing GPGPU to traverse dependencies and fuse operations.
- `operationTree` preserves semantic grouping and includes registered operations even when they are not selected outputs. Groups add no synchronization or materialization boundary.
- `compiled.outputNodes` maps each selected output ID to its node ID, including multiple names for one evaluator.
- `compiled.nodes` describes reachable evaluator dependencies in dependency order. It is an inspection view, not a dispatch schedule; fusion can eliminate intermediate expressions.
- Repeated runs reuse evaluator caches and preserve physical chunk boundaries. Explicit wrappers borrow evaluators and results. Callers destroy those evaluators after their results are no longer needed; compiled.destroy() releases semantic adapters.

## Cleaning up explicit evaluator expressions

Destroying an output evaluator releases only its own storage, not its dependencies. For borrowed
expressions, use the existing `cleanEvaluate` helper after the **final** graph run to release
intermediate buffers while preserving every result still in use:

```typescript
import {cleanEvaluate} from '@luma.gl/gpgpu';

// All retained roots must be listed, including roots used outside this graph.
// These roots are already materialized by the final run.
const retained = {input, ...compiled.outputs};
await cleanEvaluate(device, retained);

// After all consumers have finished with the retained results:
for (const evaluator of new Set(Object.values(retained))) evaluator.destroy();
compiled.destroy();
```

Only clean dependencies exclusively owned by this expression; include other consumers' retained
roots or defer cleanup until those consumers finish. Do not rerun a graph after destroying its
dependencies. Semantic adapters are owned by the compiled graph and need only `compiled.destroy()`.

## Capabilities and limits

GPUSimpleGraphOperation is currently executable only by GPUSimpleGraph. Acceptance by GPUProgram provides shared composition and inspection, not a lowering in GPUProgramCompiler or compatibility with GPUGraph.add().

The graph reports no caller-controlled submission, dynamic bindings, or transient allocation. There is no encode() method: run() delegates submission to evaluators. Backend operation support and the existing CPU constant fast path remain unchanged; the wrapper introduces no CPU fallback or readback.

Snapshots borrow evaluator objects rather than cloning their computation. Treat the evaluator dependencies as immutable after compilation. Concurrent runs over shared evaluators remain unsupported. There is no indirect execution, graph-wide cancellation, or render/copy command support.

Later phases can expand the supported semantic subset and investigate deferred submission and buffer/texture transform operations.
