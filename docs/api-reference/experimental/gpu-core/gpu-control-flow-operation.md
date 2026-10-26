import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPU operation control flow

## Overview

`GPUConditionalOperation` and `GPULoopOperation` add **structured control-flow semantics** to the GPU operation IR.

The important distinction is that an operation describes the program while lowering decides how that program executes.

<GPUOperationContract operation="gpu-control-flow-operation" />

```text
GPULoopOperation
  predicate: residual² > tolerance²
  maximumIterations: 256
  body: PCG iteration
              │
              ▼
      operation-aware lowering
        ├─ bounded unroll
        └─ GPU-resident dynamic control
              │
              ▼
       GPUCommandGraph nodes
```

## Why control flow belongs above command nodes

A numerical algorithm such as conjugate gradient is naturally written as a loop:

```text
while residual > tolerance and iteration < maximumIterations
    q = A p
    alpha = rho / dot(p,q)
    x = x + alpha p
    r = r - alpha q
    z = M^-1 r
    rhoNew = dot(r,z)
    beta = rhoNew / rho
    p = z + beta p
```

Encoding 64 copies of those operations into the semantic IR loses the fact that this is one iterative algorithm. `GPULoopOperation` preserves that fact.

## Bounded loops

GPU loops always carry `maximumIterations`. This provides a finite static bound for scheduling, workload estimation, diagnostics and safety even when the actual exit condition is GPU-resident.

`minimumIterations` can express algorithms that must perform some work before convergence is tested.

## Predicates

A `GPUOperationPredicate` records semantic intent:

```ts
const active = program.scalar('active', 'uint32');
const predicate = {
  id: 'pcg-active',
  source: 'gpu' as const,
  value: active,
  expression: 'residualSquared > toleranceSquared'
};
```

`value` identifies GPU-produced uint32 state; `expression` is diagnostic text, not executable
shader source. The predicate intentionally does not contain an indirect-dispatch buffer or workgroup count. Those are properties of a concrete lowering, not of the mathematical program.

## Lowering

The IR supports explicit lowering choices (or `auto` to let the compiler select):

- `unroll`: duplicate a bounded body into command nodes;
- `dynamic-gpu`: preserve a GPU predicate and let an operation-aware compiler select a GPU-resident realization.

WebGPU dynamic lowering uses GPU-written indirect dispatch arguments to gate each compute node. Contributors must declare exact dispatch geometry. See [WebGPU runtime control](/docs/api-reference/experimental/gpu-core/webgpu-runtime-control) for the execution contract.

This separation is important:

```text
semantic loop                  executable realization
-------------                  ----------------------
condition                      dispatch gates
maximumIterations      ->      node expansion / control
body operation tree            concrete compute passes
```

## Composite hierarchy

Control-flow operations are specialized composites. The inspector can therefore retain:

```text
PCG
└─ loop max=256
   ├─ predicate: residual² > tolerance²
   └─ iteration
      ├─ SpMV
      ├─ reductions
      ├─ scalar arithmetic
      ├─ vector updates
      └─ Jacobi
```

A loop body remains one semantic subtree even when an unrolled lowering produces many command nodes.

## What this does not imply

Structured control flow does not introduce synchronization by itself, does not choose an execution strategy, and does not require a CPU readback. It gives planners enough semantic information to choose among legal realizations later.
