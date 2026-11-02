# Graph inputs, results, and state

Applications declare the graph's external interface. Operations define their results and
private temporaries; callers do not need to declare every intermediate value.

| Value | Declared by | Storage |
| --- | --- | --- |
| Input | `graph.addInput(name, descriptor)` | Supplied for each run; read-only to operations |
| Produced result | The producing operation's contract | Allocated by execution, or a selected caller-owned output target |
| State | `graph.addState(name, descriptor)` | Initialized, caller-owned vector supplied for each run |
| Private command scratch | The operation's lowering | Managed by the command graph and its resource planner |

## Declare the interface, add operations

```typescript
import {GPUGraph, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';

const graph = new GPUGraph();
graph.addInput('positions', gpuGraph.vector('float32x3'));
graph.addInput('scale', gpuGraph.scalar('float32'));

graph.add([
  new GPUExpressionOperation({output: 'scaled', expression: 'positions * scale'}),
  new GPUExpressionOperation({output: 'lengths', expression: 'length(scaled)'})
]);

const compiled = graph.compile(device, {outputs: ['lengths']});
const results = await compiled.run({
  inputs: {positions: positionsVector, scale: 2}
});
// After downstream GPU consumers finish:
results.lengths.destroy();
compiled.destroy();
```

There are no declarations for `scaled` or `lengths`. Expressions infer their numeric formats,
component widths, and scalar/vector kinds from their inputs. Result declarations are resolved
on a compilation snapshot; compilation does not add declarations to the authored graph.

`gpuGraph.scalar(format)` describes a numeric scalar supplied as a JavaScript number.
`gpuGraph.vector(format, constraints?)` describes packed rows supplied as a `GPUVector`.
Neither helper creates GPU resources. A vector's length and exact chunk boundaries normally
come from execution bindings, so the same compiled graph can run on differently sized batches.
Optional `{length, chunkLengths}` constraints are checked rather than used to repack inputs.

## Select results and optionally supply storage

`compile(device, {outputs: [...]})` selects which named results escape an invocation.
Unselected intermediates are owned and released by execution. When operation-defined results
are present and `outputs` is omitted, terminal results (those not read by another operation)
are selected. Pass `outputs: []` for a state-only invocation.

```typescript
const results = await compiled.run({
  inputs: {positions: positionsVector, scale: 3},
  outputTargets: {lengths: destinationVector}
});
// results.lengths === destinationVector; storage remains caller-owned.
```

Targets must name selected produced results and match their formats, row counts, chunk
boundaries, and device. They cannot replace inputs or state. Aliasing incompatible writable
ranges is rejected. Without a target, returned produced vectors transfer to the caller;
caller-supplied inputs, targets, and state are always borrowed.

Logical intermediates remain alive for the invocation. This API does not introduce new
cross-operation buffer reuse or fusion. Operation-private transient command resources retain
the existing command graph's allocation and reuse behavior. Lowerings should describe scratch
resources through the command graph rather than privately allocating opaque buffers.

## Operation-defined results

A custom operation can publish result declarations through its contract:

```typescript
const copyContract: GPUOperationContract = {
  outputs: {copied: gpuGraph.vector('uint32x2')},
  values: [
    {value: 'input', access: 'read'},
    {value: 'copied', access: 'write', shape: {like: 'input'}}
  ]
};
```

`outputs` defines logical types; the writable use's `shape` describes dimensions. For dependent
types, `outputs` can be a pure function of logical input declarations:

```typescript
const copyContract: GPUOperationContract = {
  outputs: ({getValue}) => ({copied: getValue('input')}),
  values: [
    {value: 'input', access: 'read'},
    {value: 'copied', access: 'write', shape: {like: 'input'}}
  ]
};
```

Import `GPUOperationContract` as a type from `@luma.gl/graph`. Output inference receives no
GPU data or device and must not allocate resources or have side effects. It may run more than
once during compilation. The operation's lowering uses the resolved names through
`context.resolveVector()` or `context.resolveScalar()` as before.

Add producers before consumers. Produced results have a single writer. A missing producer,
multiple writers, writes to inputs, and result names conflicting with inputs or state fail
at compilation. Existing explicit `.scalar()`/`.vector()` declarations and flat execution
bindings remain supported for existing graph consumers; the role-based interface uses grouped
bindings. Evaluator APIs are unchanged.

## Borrowed mutable state

```typescript
const positions = graph.addState('positions', gpuGraph.vector('float32x3'));
```

An operation updating this value declares `read-write`, or separate read and write uses, in
its contract. It must implement safe mutation in its lowering. The state name must not also
appear in `contract.outputs`, which is reserved for produced results.

```typescript
await compiled.run({
  inputs: {deltaTime: 1 / 60},
  state: {positions: positionsVector}
});
```

Supply initialized state on every invocation. Reusing the same vector preserves its contents
across runs; rebinding a different initialized vector starts from that vector's contents.
The compiled graph does not retain state bindings or implicitly initialize, reset, swap, or
destroy state. A selected state output is the same borrowed vector, not transferred ownership.

State currently requires vector storage. Represent a single mutable GPU element as a vector
with `{length: 1}`; `gpuGraph.scalar()` remains a host numeric input or an operation-produced
scalar result, not a persistent GPU scalar binding. Expressions cannot write directly to
state. Use a supported state-writing operation or an explicit copy lowering after producing
an expression result. In-place expression execution and managed state lifecycles are separate
work.

## Backend and allocation boundaries

`GPUSimpleGraph` supports the same `addInput`, inferred expression results, and grouped input
bindings on WebGL and WebGPU. Its reusable expression path rejects state declarations and
custom lowerings explicitly. Its existing evaluator-backed APIs remain unchanged.

This tranche supports fixed sizes and sizes derived from execution bindings or preceding
operation results whose dimensions are already known to the CPU. `shape: {like: input}`
preserves exact chunk boundaries; `{length, chunkLengths?}` specifies fixed dimensions.

GPU-computed logical lengths, capacity/count pairs, exact-size allocation after readback,
and staged execution are not implemented here. If dimensions cannot be determined from a
contract, declaration, or supplied target, preparation fails instead of guessing a capacity.
New operation-defined results inside conditionals/loops are also deferred; existing explicit
control-flow declarations remain supported.

Use `graph.compile(device).run(...)` for runtime-sized results. The lower-level
`GPUGraphCompiler.compile(graph, bindings)` still requires concrete vector dimensions.
