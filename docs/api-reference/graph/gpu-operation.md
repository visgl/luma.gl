# GPUOperation contracts

A `GPUOperation` describes logical work. Its contract identifies graph values it reads and
writes and how vector output dimensions are determined. A supplied lowering turns the
operation into command-graph passes. Contracts do not execute work or own GPU storage.

Operations can [define their own results](./gpu-graph-values.md#operation-defined-results), so
applications declare external inputs and state rather than every intermediate. If you are new
to graph execution, start with [Getting started](./getting-started.md).

Built-in [upload/copy](./gpu-transfer-operations.md) and [compaction](./gpu-compaction-operation.md)
operations already provide these contracts and their backend lowerings.

## Contract types

```typescript
import {GPUGraph, gpuGraph, type GPUOperation, type GPUOperationContract, type GPUOperationLowering} from '@luma.gl/graph';

class CopyRows implements GPUOperation {
  readonly type = 'copy-rows';
  readonly contract: GPUOperationContract;

  constructor(
    readonly id: string,
    readonly input: string,
    readonly output: string
  ) {
    this.contract = {
      outputs: {[output]: gpuGraph.vector('uint32x2')},
      values: [
        {value: input, access: 'read'},
        {value: output, access: 'write', shape: {like: input}}
      ]
    };
  }
}
```

A reference may be a scalar, vector, or texture declaration, or its string name. Both forms
resolve through the graph's declaration namespace. Typed references must have the declared
kind and format. They are not physical buffers or command-graph views.

| Access | Meaning |
| --- | --- |
| `read` | Uses an existing value. |
| `write` | Produces or replaces a value. |
| `read-write` | Requires initialized storage and updates that same value. |

List every logical read and write. Reusable-program planning uses these declarations to
check producer order, discover scalar results, allocate vector outputs, and accept output
targets. Add producers before consumers; contracts do not implicitly reorder operations.
Operation-defined results have one writer and cannot also be inputs or state. Use `addState()`
for initialized mutable vector storage supplied on each execution. Existing explicit declarations
can retain their older read-before-replacement behavior, but new operations should distinguish
produced results from state. Output targets cannot replace inputs or state.
Actual command-node resource uses remain required: they describe physical accesses and are
what the command graph uses for scheduling and hazards. A produced result must be initialized
by its producer before consumers read it: write every element they need, or add an explicit
initialization pass before partial updates or atomics. Transient storage may contain an earlier
result; a `write` contract does not promise zero-filled memory. Use initialized state for values
that depend on previous contents.

`metadata` remains optional diagnostic information. It does not substitute for a contract.
Contracts are readonly descriptions; do not mutate them after compilation.

## Vector output shapes

Shapes apply only to writable vector values:

| Shape | Behavior |
| --- | --- |
| `{like: input}` | Inherits row count and exact chunk boundaries, including empty chunks, from a declared vector read. |
| `{length: count}` | Uses a fixed row count; a declared output partition is retained when present. |
| `{length: count, chunkLengths: [...]}` | Uses an explicit fixed partition whose lengths sum to `count`. |
| Omitted | Uses the output declaration or supplied output storage. |

The output declaration supplies its format independently of its shape. A custom operation
can therefore produce `uint32x2`, for example, without the planner assuming float32 storage.
Fixed length and chunk constraints on declarations are enforced, and input chunks are never
implicitly repacked to satisfy an output shape.

Shapes do not express GPU-computed output lengths, arbitrary shape callbacks, or relationships
among every input. Operation-specific type/layout validation still belongs to the operation
and its lowering. Expressions retain their existing type inference and matching-chunk rules.

For reusable programs, `read-write` vector values require execution bindings. A distinct
output target cannot replace their initialized storage. This contract does not introduce
implicit state initialization or permit self-referential expression outputs.

## Supply lowerings

Extensions add to the built-in lowerings:

```typescript
const copyRowsLowering: GPUOperationLowering<void, CopyRows> = {
  type: 'copy-rows',
  lower: (operation, context) => {
    const source = context.resolveVector(operation.input);
    const destination = context.resolveVector(operation.output);
    if (source.format !== 'uint32x2') throw new Error('CopyRows expects uint32x2');

    source.data.forEach((chunk, index) => {
      if (chunk.length === 0) return;
      const output = destination.data[index];
      context.graph.addCopyPass({
        id: `${operation.id}-${index}`,
        resources: [
          {buffer: chunk, usage: 'copy-source'},
          {buffer: output, usage: 'copy-destination'}
        ],
        compile: () => ({
          encode: ({commandEncoder, getBuffer}) => {
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(chunk),
              sourceOffset: chunk.byteOffset,
              destinationBuffer: getBuffer(output),
              destinationOffset: output.byteOffset,
              size: chunk.length * 8 // Packed uint32x2 rows.
            });
          }
        })
      });
    });
  }
};

const graph = new GPUGraph();
graph.addInput('input', gpuGraph.vector('uint32x2'));
graph.add(new CopyRows('copy', 'input', 'output'));

const compiled = graph.compile(device, {lowerings: [copyRowsLowering], outputs: ['output']});
try {
  const results = await compiled.run({inputs: {input: inputVector}});
  try {
    // Submit downstream GPU consumers of results.output here.
  } finally {
    results.output.destroy();
  }
} finally {
  compiled.destroy();
}
```

Here `inputVector` is an existing packed `GPUVector<'uint32x2'>`. The example requires WebGPU buffers with copy-source/copy-destination usage and aligned
ranges. Lowerers describe command passes; the callbacks encode work later. Neither stage may privately
submit or read back data. Logical result buffers can share physical storage after their last
operation, so use `getBuffer()` during encoding and do not retain intermediate buffers beyond
the declared uses. Private scratch should use command-graph transient declarations.

Lowering resolvers accept declaration objects or string names; for example,
`context.resolveVector('input')` resolves the declared vector to its execution view.

The same readonly descriptor array can be supplied to `new GPUGraphCompiler(device, lowerings)`.
Compose extension sets with ordinary array spread: `[...applicationLowerings, copyRowsLowering]`.
There is no registration step or shared global state. The compiler snapshots and freezes the
array and each descriptor. Later changes to the source array or descriptors do not affect it.
Duplicate type names, including collisions with built-in operations, are rejected. To change
implementations, construct a new compiler with a new set. Lowering callbacks should avoid
capturing mutable configuration. Method callbacks retain their receiver; freezing the set
and callback identities does not freeze callback-owned closures or class instance state.

Custom lowerings are a full-GPUGraph extension. SimpleGraph continues to accept its existing
expression subset and reports an error if passed custom lowerings.

## Capabilities and compatibility

`requiredFeatures` may list core `DeviceFeature` names. Compilation/execution preparation
rejects a missing feature before lowering that operation. This does not replace specialized
limit checks or make an operation portable to another backend automatically.

Existing scalar literals, scalar arithmetic, vector MADD, dot products, SpMV, and expressions
now publish contracts. Dot product demonstrates an existing algorithm whose scalar result
can feed an expression without a class-specific producer check in the planner. Their kernels
and evaluator APIs are unchanged.

Contracts remain optional for compatibility with existing command producers and unmigrated
operations. Such operations do not gain automatic reusable-output planning merely by being
accepted by the command compiler. Texture references can be described and validated, but
reusable `GPUGraph.compile(device).run()` texture bindings are currently unsupported.
