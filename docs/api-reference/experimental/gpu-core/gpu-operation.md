# GPU operation IR

`GPUCommandGraph` has historically been built by asking reusable algorithms to immediately contribute compute, render and copy nodes through `addToGraph()`. That remains a useful lowering mechanism, but command nodes are already too concrete to represent the semantic program that produced them.

The operation IR introduces a small layer above command nodes:

```text
GPUOperation                  what the program means
     ↓ lowering
GPUCommandGraph nodes         how WebGPU work is organized
     ↓ compilation
WebGPU commands               what is encoded
```

## Adding operations

The preferred construction form is:

```ts
const graph = new GPUCommandGraph(device);

graph.add([
  new GPUAdaptiveSpMV({...}),
  new GPUDotProduct({...}),
  new GPUVectorScalarMADD({...})
]);
```

`graph.add()` also accepts one operation. Nested arrays are flattened and exist only as construction convenience.

Existing `GPUCommandGraphContributor` implementations remain accepted during migration. This allows the semantic API to land without requiring every algorithm to change in one PR.

## Semantic composition

Use `GPUCompositeOperation` when a group has meaning that should survive into planning and inspection:

```ts
const iteration = new GPUCompositeOperation({
  id: 'pcg-iteration',
  operations: [
    spmv,
    dot,
    alpha,
    updateSolution,
    updateResidual,
    precondition,
    beta,
    updateDirection
  ]
});

graph.add(iteration);
```

The shorthand constructor is useful when a name is unnecessary:

```ts
new GPUCompositeOperation([operation1, operation2]);
```

### Array vs composite

```text
graph.add([A, B, C])
```

adds three sibling operations. The array itself has no semantic identity.

```text
graph.add(new GPUCompositeOperation({id: 'solver-step', operations: [A, B, C]}))
```

adds one semantic `solver-step` whose children remain visible to an inspector.

A composite **does not imply synchronization**. It is semantic hierarchy only. Resource hazards and explicit control dependencies continue to determine execution order.

## Why preserve hierarchy?

A flattened command list can tell us that the GPU dispatched 37 kernels. It cannot tell us that those kernels were one PCG iteration, one FFT, or one sparse conversion.

Preserving operation identity allows an inspector to present:

```text
Poisson solve
└─ PCG
   ├─ initialize
   ├─ iteration
   │  ├─ adaptive SpMV
   │  ├─ dot
   │  ├─ vector updates
   │  └─ Jacobi
   └─ residual
```

while command-graph compilation remains free to lower those operations into whatever node structure WebGPU requires.

## Operations as the compiler boundary

The initial `GPUOperation` contract is deliberately small: semantic identity plus the existing lowering hook. It should grow only when real planner requirements are demonstrated.

Future operation metadata may include logical inputs/outputs, workload shape, constraints and strategy candidates. A planning layer can then reason about:

```text
operation intent + logical resources + workload + device
                         ↓
                  execution strategy
                         ↓
                  command graph nodes
```

This is the intended seam for future device specialization and Ploor-style planning. The command graph remains the execution substrate; it should not need to understand why a higher-level algorithm was selected.

## Future control operations

Once semantic operations are established, structured GPU programs can add explicit IR constructs without overloading command nodes:

```text
GPUOperation
├─ GPUCompositeOperation
├─ GPULoopOperation
└─ GPUConditionalOperation
```

Loops and conditionals are intentionally outside the first operation-IR change. The initial goal is simply to preserve semantic computation long enough for future compilation stages to see it.
