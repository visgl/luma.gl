import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUConjugateGradient

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUConjugateGradient` solves linear systems `Ax = b` where `A` is a sparse symmetric positive-definite (SPD) matrix represented in CSR form.

The important architectural goal is not merely implementing conjugate gradient. It is demonstrating that graph-native sparse multiplication, vector arithmetic and scalar reductions compose into a complete iterative numerical method while keeping intermediate state GPU-resident.

## Intuition: finding the bottom of a quadratic bowl

For an SPD matrix `A`, solving

```text
A x = b
```

is equivalent to minimizing the quadratic function

```text
f(x) = 1/2 xᵀ A x - bᵀ x
```

because its gradient is

```text
∇f(x) = A x - b
```

and the minimum therefore satisfies `Ax - b = 0`.

A simple gradient-descent solver repeatedly moves downhill. On an elongated quadratic it can zig-zag, repeatedly correcting directions it has already visited:

```text
                    start
                      \
                       ↘
                  ↙
                    ↘
               ↙
                 ↘
             ● solution
```

Conjugate gradient chooses a sequence of search directions that are *A-conjugate*:

```text
pᵢᵀ A pⱼ = 0   for i ≠ j
```

Loosely, each new direction is constructed so that progress along it does not undo the minimization already achieved along previous directions. In exact arithmetic, an `n × n` SPD system converges in at most `n` iterations; practical floating-point convergence depends strongly on conditioning and usually uses a residual tolerance.

## Residual: how wrong is the current solution?

Given a current estimate `x`, define

```text
r = b - A x
```

If `r = 0`, then `Ax = b` and the system is solved. The residual is therefore both the initial search direction and the quantity used to judge convergence.

Initialization is conceptually:

```text
q = A x
r = b - q
p = r
rr = r · r
```

The solver then repeatedly improves `x` while updating `r` and the conjugate search direction `p`.

## One conjugate-gradient iteration

Each iteration is remarkably small:

```text
q = A p

alpha = (r · r) / (p · q)

x = x + alpha p
r = r - alpha q

newRR = r · r
beta = newRR / oldRR

p = r + beta p
oldRR = newRR
```

The corresponding Jarnevon dataflow is:

```text
                         ┌─────────────┐
                    p ──▶│   GPUSpMV   │──▶ q = A p
                         └──────┬──────┘
                                │
              r ───────┐        │
                       ▼        ▼
                 ┌────────┐  ┌────────┐
                 │ dot(r,r)│  │ dot(p,q)│
                 └────┬───┘  └────┬───┘
                      │           │
                      └─────┬─────┘
                            ▼
                  alpha = rr / pDotQ
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
          x = x + alpha p       r = r - alpha q
                 │                     │
                 │                     ▼
                 │                 dot(r,r)
                 │                     │
                 │              beta = newRR / rr
                 │                     │
                 │                     ▼
                 └────────────── p = r + beta p
                                       │
                                       └──────── ↺
```

This is why CG is a useful integration test for the GPU graph architecture. The solver itself should mostly orchestrate reusable operations:

```text
q = A p                       GPUSpMV
alpha = (r·r) / (p·q)         GPUDotProduct + scalar arithmetic
x = x + alpha p               GPUElementwise / MADD
r = r - alpha q               GPUElementwise / MADD
newRR = r·r                   GPUDotProduct
beta = newRR / oldRR          scalar arithmetic
p = r + beta p                GPUElementwise / MADD
```

If this requires bespoke hidden compute kernels throughout the solver, the primitive layer is incomplete.

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

## Why GPU scalars matter

CG exposes an important distinction between vector and scalar state. `x`, `r`, `p`, and `q` are vectors, while `rr`, `pDotQ`, `alpha`, and `beta` are scalars:

```text
GPU vectors                         GPU scalars
-----------                         -----------
x                                  rr = r · r
r                                  pDotQ = p · q
p                                  alpha
q                                  beta
```

Those scalars must remain on the GPU. Reading `alpha` or `beta` back to JavaScript every iteration would introduce synchronization into the solver loop and undermine command-graph execution.

The desired graph model therefore treats GPU scalars as first-class values that can feed later operations and can be broadcast into vector MADD operations:

```text
GPUScalar alpha ─────┐
                     ▼
GPUVector p ───────▶ MADD ─────▶ x
GPUVector x ───────▶
```

CG is consequently a direct motivation for a graph-native GPU scalar abstraction and scalar arithmetic.

## GPU-resident iteration state

The Jarnevon target is that all temporary vectors and scalars remain graph-managed GPU state:

```text
CPU
 │
 │ submit graph
 ▼
┌──────────────────────── GPU ────────────────────────┐
│                                                    │
│ initialize x, r, p                                │
│        │                                           │
│        ▼                                           │
│   ┌───────── solver iteration ────────────────┐    │
│   │ SpMV → dot → scalar math → vector MADDs   │    │
│   │                    │                       │    │
│   │                    └──── convergence       │    │
│   └─────────────────────── ↺ ──────────────────┘    │
│        │                                           │
│        ▼                                           │
│     solution x                                     │
└────────────────────────────────────────────────────┘
```

There should be no CPU readback between iterations merely to calculate coefficients or test a residual.

## Convergence

Classic CG terminates when the residual norm is sufficiently small or a maximum iteration count is reached. A typical relative criterion is based on

```text
||r||₂ = sqrt(r · r)
```

compared with the initial residual or right-hand-side norm.

A fixed `maxIterations` is straightforward to encode into a command graph. Early convergence without CPU synchronization requires GPU-side conditional execution, loop/control support, indirect dispatch, or a masking strategy.

The initial API includes `tolerance` to establish solver semantics, but the first execution implementation should not fake early termination with CPU readbacks. Until graph-level GPU conditionals are available, implementations may execute the configured maximum iteration count while maintaining GPU convergence state, or introduce an explicitly documented GPU-driven masking strategy.

This makes CG a pressure test for the command graph itself:

```text
GPUScalar residual
       │
       ▼
 residual < tolerance?
       │
   ┌───┴────┐
   │        │
 stop    next iteration
```

Iterative solvers expose the need for loops, conditionals and scalar dependencies as first-class GPU execution concepts.

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
2. add first-class GPU scalar values and arithmetic
3. compose fixed-iteration CG entirely on GPU
4. benchmark and optimize transient allocation/fusion
5. add graph-native convergence control
6. add Jacobi preconditioning
7. consider additional Krylov solvers only after the reusable solver substrate is clear

The success criterion is architectural: a complete solver should read like a composition of GPU graph primitives, not like an isolated monolithic WGSL program.
