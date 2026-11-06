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
`gpuGraph.texture({format, ...})` describes a texture supplied as a `Texture` or `TextureView`;
see [texture values and execution bindings](./gpu-graph-textures.md).
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

## Intermediate storage reuse

For straight-line WebGPU `GPUGraph` executions, unselected operation-defined vector results
remain logical shape declarations until lowering. The command-graph planner allocates their
chunks and can reuse physical buffers when scheduled lifetimes do not overlap. Logical row
counts and exact chunk boundaries are unchanged; compatible buffers may have different formats
or capacities because each view retains its own layout and the allocation uses sufficient capacity
and the union of required usages.

All logical inputs and outputs of an operation overlap for allocation purposes, including when
its lowering emits multiple passes. Reuse does not imply in-place execution. Private command
scratch retains its finer command-level lifetimes. Lowerings must declare actual physical reads
and writes and resolve buffers through the encoding context; they must not cache a logical
intermediate's physical storage for later use. Transient contents are unspecified until written;
producers must initialize all elements that consumers read, including explicit clearing before
accumulation when required.

Borrowed inputs, mutable state, caller-owned targets, and selected outputs never enter this
pool. Selected results keep independent storage even when another operation consumes them.
Legacy explicit result declarations, control-flow graphs, scalars, and SimpleGraph retain their
existing allocation behavior. Each prepared execution owns a separate pool: concurrently
prepared invocations cannot reuse one another's storage. No expression fusion or cross-run
pooling is introduced. Destroy the prepared execution after submission to release its scratch.

## Caller-owned encoding

`compiled.prepare(bindings)` binds one invocation, resolves dimensions, and allocates its
results and scratch. It does not encode commands or submit work. Each prepared execution
can be encoded once into a caller-owned encoder:

```typescript
import type {CommandEncoder} from '@luma.gl/core';

const execution = compiled.prepare({
  inputs: {positions: positionsVector, scale: 2}
});
let encoder: CommandEncoder | undefined;
try {
  encoder = device.createCommandEncoder();
  execution.encode(encoder);
  // Append other graph work or rendering that consumes execution.outputs.lengths.
  device.submit(encoder.finish());
} finally {
  // On failure, abandon the encoder; never submit a partially encoded invocation.
  encoder?.destroy();
  execution.destroy();
  // This example retains no outputs, including on failure or cancellation.
  execution.outputs.lengths.destroy();
}
```

`execution.outputs` is available immediately after preparation, allowing one prepared
graph's outputs to bind another graph before either is submitted. GPU contents become
available in command order. Encoding neither finishes nor submits nor destroys the encoder.
The encoder must belong to the compiled graph's device.

Keep the compiled graph, borrowed bindings, outputs, and prepared execution alive through
submission. Call `execution.destroy()` **after submission**, or after abandoning an
unsubmitted encoder. This releases invocation scratch and command resources, while preserving
outputs and borrowed inputs, state, and targets. It is idempotent. You need not wait for GPU
completion to release scratch after submission; keep outputs alive for downstream consumers.
Destroying the compiled graph prevents further preparation or encoding.

An execution cannot be encoded twice, including after a failed encoding attempt. To run again,
prepare another execution. Cancellation before encoding uses the same `destroy()` method;
allocated outputs still belong to the caller and must also be destroyed when unused.

`await compiled.run(bindings)` is the convenience path over preparation, encoding, submission,
and scratch cleanup. On failure it also releases allocated outputs that it could not return;
borrowed resources survive. Its promise does not imply GPU completion. These caller-owned
encoding APIs apply to WebGPU `GPUGraph`; SimpleGraph's evaluator and execution APIs are unchanged.

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


## CPU operations and execution-sized results

`GPUGraph` accepts the same `GPUCPUOperation` as [SimpleGraph](./gpu-simple-graph.md#cpu-callbacks-and-dynamically-sized-results).
Callbacks return typed arrays (or explicit chunks), and execution allocates and uploads
GPUVectors using the returned row counts. Multiple outputs can have different lengths,
and lengths may change between runs without recompiling the authored graph.

CPU-containing programs use asynchronous `compiled.run()`. GPU stages use the native
GPUGraph compiler and submit before a CPU callback reads their outputs. Downstream
stages resolve their dimensions only after the callback completes. The shared CPU executor
handles readback and uploads; it does not lower CPU work to a GPU command node.

This initial implementation supports straight-line numeric graphs with `addInput()` and
operation-owned vector results. Textures, state, output targets, and caller-controlled
`prepare()`/encoding are unsupported. GPU stages and CPU stages execute in authored order;
intermediates are retained until the invocation finishes. CPU-to-CPU chains currently cross
the GPU boundary between callbacks. Only one CPU-containing invocation may run at a time
per compiled graph, and destroying it while a callback is pending is rejected.

Selected results belong to the caller. Failures release invocation-owned intermediates,
preserve borrowed inputs, and allow subsequent runs. GPU-only programs retain their existing
preparation, transient allocation, and encoding behavior.

## CPUVector bindings and lazy transfers

Reusable numeric GPUGraph and GPUSimpleGraph programs accept `CPUVector` inputs alongside
GPUVector inputs. Declarations keep the same `gpuGraph.vector()` format and shape contract.
Use `compile(device, {outputs: ['result'], outputLocations: {result: 'cpu'}})` to return a
CPUVector; omitted locations return GPUVectors. With CPU outputs, specify the result type
through the existing compile generic, for example `compile<{result: CPUVector}>(...)`.

CPU callback results remain in CPU memory until a GPU consumer or GPU output needs them.
GPU results are read back only for CPU consumers or CPU outputs. Each invocation caches both
representations, sharing an upload or readback across branches. Caches do not survive a run.
CPU input buffers are borrowed and must remain unchanged until the run settles. Callback
input arrays remain read-only snapshots; array-returning callbacks remain compatible.

This first version supports portable float32, sint32 and uint32 rows with one to four
components. Chunk boundaries are preserved and strided CPU inputs are packed explicitly by
the executor. Nested lists, validity metadata, textures, state, output targets, and caller-owned
encoding are outside the CPU residency path. Returned CPU vectors retain their arrays without
requiring destroy(); returned GPU vectors follow the usual caller-owned lifetime.
