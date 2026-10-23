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

## Composition and lifecycle

- `add(operation)` accepts GPUSimpleGraphOperation, shared semantic composites, and nested arrays. It returns the graph. Unsupported semantic operations and command producers are rejected before registration.
- `addEvaluator(id, evaluator)` wraps and registers an evaluator, returning it unchanged for convenient expression composition.
- `compile({outputs})` freezes the builder, including when compilation fails. Rebuilding requires a new graph. The default output is the last registered leaf operation.
- Compilation allocates no GPU resources. It captures selected evaluator operations as an execution plan; `run()` evaluates those roots, allowing GPGPU to traverse dependencies and fuse operations.
- `operationTree` preserves semantic grouping and includes registered operations even when they are not selected outputs. Groups add no synchronization or materialization boundary.
- `compiled.nodes` describes reachable evaluator dependencies in dependency order. It is an inspection view, not a dispatch schedule; fusion can eliminate intermediate expressions.
- Repeated runs reuse evaluator caches and preserve physical chunk boundaries. Graphs borrow evaluators and results. Callers destroy evaluators after their results are no longer needed.

## Capabilities and limits

GPUSimpleGraphOperation is currently executable only by GPUSimpleGraph. Acceptance by GPUProgram provides shared composition and inspection, not a lowering in GPUProgramCompiler or compatibility with GPUGraph.add().

The graph reports no caller-controlled submission, dynamic bindings, or transient allocation. There is no encode() method: run() delegates submission to evaluators. Backend operation support and the existing CPU constant fast path remain unchanged; the wrapper introduces no CPU fallback or readback.

Snapshots borrow evaluator objects rather than cloning their computation. Treat the evaluator dependencies as immutable after compilation. Concurrent runs over shared evaluators remain unsupported. There is no indirect execution, graph-wide cancellation, or render/copy command support.

A later phase can lower common semantic operations through both executors, then investigate deferred submission and buffer/texture transform operations.
