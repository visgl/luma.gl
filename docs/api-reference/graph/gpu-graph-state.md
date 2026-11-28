# Mutable graph state

A compiled `GPUGraph` describes a reusable program. Its mutable state is supplied separately,
so one compiled program can advance several independent simulations.

Start with a plain binding map when your application already owns the storage:

```typescript
await compiled.run({inputs: {factor: 2}, state: {positions}});
```

Reusing `positions` preserves its contents across runs. The compiled graph never destroys it.
For explicit initialization, reset, and cleanup, use a `GPUGraphState` instance instead.
Both forms use the same declarations and operations.

## Declare, initialize, and advance

```typescript
import {GPUGraph, GPUExpressionOperation, GPUCopyOperation, gpuGraph} from '@luma.gl/graph';

const graph = new GPUGraph();
graph.addInput('factor', gpuGraph.scalar('float32'));
graph.addState('positions', gpuGraph.vector('float32x2'));
graph.add([
  new GPUExpressionOperation({output: 'nextPositions', expression: 'positions * factor'}),
  new GPUCopyOperation({input: 'nextPositions', target: 'positions'})
]);
const compiled = graph.compile(device, {outputs: ['positions']});

// initialPositions is an initialized GPUVector. Its dimensions supply the state shape.
const first = compiled.createState({positions: initialPositions}, {copy: true});
const second = compiled.createState({positions: initialPositions}, {copy: true});

await compiled.run({inputs: {factor: 2}, state: first});
await compiled.run({inputs: {factor: 3}, state: second});
// first and second now contain different values; initialPositions is unchanged.

first.reset({positions: initialPositions});
// Use first.values.positions and second.values.positions for rendering or later work.

first.destroy();
second.destroy();
compiled.destroy();
// initialPositions remains caller-owned.
```

Expressions produce results. `GPUCopyOperation` with `target` writes a result into existing
mutable storage, preserving the declared state name. The intermediate `nextPositions` is
operation-defined scratch; callers do not allocate or bind it. With `output` instead of
`target`, copy produces a new result. Supply exactly one of these properties.

## Borrowing and ownership

`compiled.createState(bindings, options?)` requires every declared state name and no extra
names. Each binding is an initialized `GPUVector` on the compilation device.

| Form | Storage | Initialization | Destruction |
| --- | --- | --- | --- |
| `state: {positions}` | Caller-owned vector | Caller supplies initialized contents | Caller destroys vector |
| `createState({positions})` | Borrows the same vector | No allocation, copy, or submission | `state.destroy()` leaves vector alive |
| `createState({positions}, {copy: true})` | Independent owned copy of each chunk | Copies on GPU and submits once | `state.destroy()` releases the copies |
| `createState({positions}, {copy: true, commandEncoder})` | Independent owned copy of each chunk | Encodes copies without submitting | Caller submits before releasing resources |

`state.values` is a read-only map of the bound vectors. `state.ownsValues` reports whether
these vectors were allocated by the instance. Do not replace their chunks or change their
format, shape, or ownership while the instance is alive. Multiple borrowed instances can
share a vector, but then they share its mutable contents too.

A state instance belongs to the compiled program that created it. It cannot be passed to a
different compiled program, even with matching declarations. Destroying the compiled program
does not destroy its state instances; they can still be read, reset, or destroyed independently.

Selecting a state name as an output returns the same vector. It does not transfer ownership
away from the state instance. Destroy ordinary allocated results separately; do not destroy a
selected state vector as if it were a new result.

## Reset and reuse

`state.reset(bindings)` copies a complete set of source vectors into the existing state and
submits once. It does not read back, resize, recompile, or retain a hidden initial snapshot.
The caller supplies the reset sources each time and owns their lifetime.

Formats, row counts, and each chunk length must match the instance's initial shape, including
empty chunks. Byte offsets may differ. Copies preserve row bytes, including integer bits;
there is no conversion or repartitioning. Sources require `COPY_SRC`, destinations require
`COPY_DST`, and source buffers must be distinct from all destination buffers. State destinations
must not alias one another. For a different shape, create a new instance.

`reset()` and `destroy()` reject use while prepared executions retain the instance. Submit or
abandon those executions and release them first. `destroy()` is idempotent. A failed `run()`
releases its execution resources without destroying the state; GPU mutations already submitted
are not rolled back.

## Caller-owned encoding

Use `encodeReset(commandEncoder, bindings)` to order resets alongside graph work. This method
neither finishes nor submits the encoder, and can be used between retained executions.

```typescript
const encoder = device.createCommandEncoder();
const state = compiled.createState(
  {positions: initialPositions},
  {copy: true, commandEncoder: encoder}
);
const firstStep = compiled.prepare({inputs: {factor: 2}, state});
const secondStep = compiled.prepare({inputs: {factor: 3}, state});
try {
  firstStep.encode(encoder);
  state.encodeReset(encoder, {positions: initialPositions});
  secondStep.encode(encoder);
  device.submit(encoder.finish());
} finally {
  firstStep.destroy();
  secondStep.destroy();
  encoder.destroy();
}
// state now holds initialPositions * 3. Release it after its final use.
state.destroy();
```

Keep initialization/reset sources, state, and prepared executions alive through submission.
For an abandoned encoder, destroy its prepared executions before destroying the state. The
instance does not track GPU completion or synchronize work across encoders: submission order
is the caller's responsibility.

## Scope

State uses packed 32-bit numeric vectors, including multi-component rows. A single persistent
GPU element is a vector with `{length: 1}`; host scalar inputs remain ordinary execution inputs.
This API does not add texture state, implicit ping-pong buffers, automatic resizing, or in-place
expression evaluation. Reusable `GPUSimpleGraph` does not support mutable state. Existing
evaluator APIs are unchanged.
