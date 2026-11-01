# GPUOperation contracts

A `GPUOperation` describes logical work. Its contract identifies graph values it reads and
writes and how vector output dimensions are determined. A supplied lowering turns the
operation into command-graph passes. Contracts do not execute work or own GPU storage.

This is the first part of the unified graph API: existing declarations and execution methods
remain unchanged. Input/value/state declaration roles, new invocation APIs, and changes to
control flow are not introduced here.

## Contract types

```typescript
import type {GPUOperation, GPUOperationContract} from '@luma.gl/graph';

class CopyRows implements GPUOperation {
  readonly type = 'copy-rows';
  readonly contract: GPUOperationContract;

  constructor(
    readonly id: string,
    readonly input: GPUGraphVector<'uint32x2'>,
    readonly output: GPUGraphVector<'uint32x2'>
  ) {
    this.contract = {
      values: [
        {value: input, access: 'read'},
        {value: output, access: 'write', shape: {like: input}}
      ]
    };
  }
}
```

Import `GPUGraphVector` as a type from `@luma.gl/graph` for this example.
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
Actual command-node resource uses remain required: they describe physical accesses and are
what the command graph uses for scheduling and hazards.

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
new mutable-state semantics or permit self-referential expression outputs.

## Supply lowerings

Extensions add to the built-in lowerings:

```typescript
const copyRowsLowering: GPUOperationLowering<void, CopyRows> = {
  type: 'copy-rows',
  lower: (operation, context) => {
    const source = context.resolveVector(operation.input);
    const destination = context.resolveVector(operation.output);

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
const input = graph.vector('input', 'uint32x2');
const output = graph.vector('output', 'uint32x2');
graph.add(new CopyRows('copy', input, output));

const compiled = graph.compile(device, {lowerings: [copyRowsLowering], outputs: ['output']});
const results = await compiled.run({input: inputVector});
// Once downstream GPU consumers have finished:
results.output.destroy();
compiled.destroy();
```

Import `GPUGraph` and the `GPUOperationLowering` type from `@luma.gl/graph`.
The example requires WebGPU buffers with copy-source/copy-destination usage and aligned
ranges. Lowerers encode work; they must not privately submit or read back data.

Lowering resolvers accept declaration objects or string names; for example,
`context.resolveVector('input')` resolves the declared vector to its execution view.

The same readonly descriptor array can be supplied to `new GPUGraphCompiler(device, lowerings)`.
Compose extension sets with ordinary array spread: `[...applicationLowerings, copyRowsLowering]`.
There is no registration step or shared global state. The compiler snapshots and freezes the
array and each descriptor. Later changes to the source array or descriptors do not affect it.
Duplicate type names, including collisions with built-in operations, are rejected. To change
implementations, construct a new compiler with a new set. Lowering callbacks should avoid
capturing mutable configuration; freezing descriptors cannot freeze their closures.

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
reusable `GPUGraph.compile().run()` texture support remains a later tranche.
