import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUConjugateGradient

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUConjugateGradient` is the first solver-level composition in the GPU graph roadmap. It targets linear systems `Ax = b` where `A` is a sparse symmetric positive-definite (SPD) matrix represented in CSR form.

The important architectural goal is not merely implementing conjugate gradient. It is demonstrating that graph-native sparse multiplication, vector arithmetic and scalar reductions compose into a complete iterative numerical method while keeping intermediate state GPU-resident.

## Why conjugate gradient?

Conjugate gradient is an unusually useful integration test because its iteration consists almost entirely of the primitive vocabulary being built:

```text
q = A p                       GPUSpMV
alpha = (r·r) / (p·q)         GPUDotProduct + scalar arithmetic
x = x + alpha p               GPUElementwise / MADD
r = r - alpha q               GPUElementwise / MADD
newRR = r·r                   GPUDotProduct
beta = newRR / oldRR          scalar arithmetic
p = r + beta p                GPUElementwise / MADD
```

If this requires bespoke hidden compute kernels throughout the solver, the primitive layer is incomplete. The intended implementation therefore composes public graph operations rather than duplicating them inside the solver.

## Contract

The initial solver accepts a square CSR `float32` matrix, a packed `float32` right-hand side, and a caller-owned solution vector. `solution` supplies the initial guess and receives the final iterate.

```ts
new GPUConjugateGradient({
  matrix: {
    rowOffsets,
    columnIndices,
    values,
    columns: n
  },
  rhs: b,
  solution: x,
  maxIterations: 100,
  tolerance: 1e-5
}).addToGraph(graph);
```

The caller is responsible for the mathematical precondition that `A` is symmetric positive-definite. Checking SPD on the GPU would be a separate and potentially expensive operation and is not part of solver submission.

## GPU-resident iteration state

A solver needs temporary vectors such as residual `r`, search direction `p`, and matrix product `q`, plus scalar state such as `r·r`, `p·q`, `alpha`, and `beta`.

The Jarnevon target is that all of this remains graph-managed GPU state:

```text
CPU
 │ submit graph
 ▼
GPU: initialize residual/search direction
 │
 ├─ SpMV
 ├─ dot products
 ├─ scalar updates
 ├─ vector MADDs
 └─ convergence state
      ↺
GPU
 │
 ▼
solution
```

There should be no CPU readback between iterations merely to calculate coefficients or test a residual.

## Convergence

Classic CG terminates when the residual norm is sufficiently small or a maximum iteration count is reached. A fixed `maxIterations` is straightforward to unroll into a command graph. Early convergence without CPU synchronization requires GPU-side conditional execution or indirect dispatch/control machinery.

The initial API includes `tolerance` to establish solver semantics, but the first execution implementation should not fake early termination with CPU readbacks. Until graph-level GPU conditionals are available, implementations may execute the configured maximum iteration count while maintaining GPU convergence state, or introduce an explicitly documented GPU-driven masking strategy.

This makes CG a useful pressure test for the command graph itself: iterative solvers expose the need for loops, conditionals and scalar dependencies as first-class GPU execution concepts.

## Numerical considerations

CG convergence depends strongly on matrix conditioning. `float32` is appropriate as the initial WebGPU baseline but is not sufficient for every numerical problem. Preconditioning is often more important than simply increasing the iteration count.

The first solver intentionally does not hide a preconditioner. Future work can add a composable preconditioning interface, beginning with Jacobi/diagonal preconditioning and later considering more sophisticated sparse methods if justified.

Floating-point reductions are not associative, so GPU reduction order can produce small differences from CPU implementations or other GPU strategies. Tests should use residual/error tolerances rather than bitwise equality.

## Performance

For large sparse systems, SpMV generally dominates each iteration, followed by global reductions and vector memory traffic. Performance work therefore spans multiple primitives rather than one solver kernel:

- optimize CSR SpMV for row-length distributions
- use hierarchical/subgroup dot reductions
- fuse coefficient application with vector updates
- eliminate unnecessary transient buffers
- reuse graph-managed allocations across iterations
- reduce command encoding overhead for repeated iteration structure

This is precisely why the solver belongs above the primitive layer.

## Dependency staging

This draft establishes the solver API and orchestration boundary while `GPUSpMV`, `GPUDotProduct` and `GPUElementwise` are still proposed on separate roadmap branches. The execution body should be completed by composing those operations once their contracts land on master rather than copying their kernels into this PR.

## Roadmap

1. land SpMV, dot and elementwise foundations
2. compose fixed-iteration CG entirely on GPU
3. add GPU scalar arithmetic needed for `alpha` and `beta`
4. benchmark and optimize transient allocation/fusion
5. add graph-native convergence control
6. add Jacobi preconditioning
7. consider additional Krylov solvers only after the reusable solver substrate is clear

The success criterion is architectural: a complete solver should read like a composition of GPU graph primitives, not like an isolated monolithic WGSL program.
