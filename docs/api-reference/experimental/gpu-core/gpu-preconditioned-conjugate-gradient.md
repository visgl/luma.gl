# Preconditioned conjugate gradient

## At a glance

| Question                 | Answer                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Problem**              | Accelerate conjugate-gradient convergence with a reusable preconditioner.                                 |
| **Reads / writes**       | Reads sparse matrix and residual state; writes preconditioned vectors and solver scalars.                 |
| **Ownership**            | Caller-owned matrix and solution surround graph-owned iterative scratch.                                  |
| **Output contract**      | A fixed-budget approximate solution with GPU-resident convergence control.                                |
| **Expected work**        | One preconditioner application plus sparse products and reductions per iteration.                         |
| **Chunks**               | Independent CSR and vector chunks share one logical system; scratch follows the right-hand side topology. |
| **Conditions / budgets** | Later iterations can be disabled by GPU indirect convergence gates.                                       |
| **Neighborhood**         | CSR matrix + right-hand side + preconditioner → PCG → solution vector.                                    |

**Cost**Iteration count times SpMV, preconditioner, vector-update, and reduction costs.

**Common mistake**Do not choose a preconditioner whose application costs more than the iterations it saves.

## Overview[​](#overview "Direct link to Overview")

Conjugate gradient (CG) solves sparse symmetric positive-definite systems `Ax = b`. Preconditioned conjugate gradient (PCG) applies an inexpensive approximation to `A^-1` so that the transformed problem converges in fewer iterations.

## Why preconditioning matters[​](#why-preconditioning-matters "Direct link to Why preconditioning matters")

CG convergence depends on the spectrum of the matrix. Poorly conditioned systems may require many iterations even though every individual iteration is inexpensive. A preconditioner `M` approximates `A` while remaining much cheaper to invert.

```
A x = b

  │

  ├── residual r = b - A x

  │

  ├── solve approximately M z = r

  │

  └── use z to choose the next search direction
```

A useful preconditioner therefore trades a little additional work per iteration for substantially fewer iterations.

## Jacobi preconditioning[​](#jacobi-preconditioning "Direct link to Jacobi preconditioning")

The Jacobi preconditioner keeps only the diagonal of the matrix:

```
M = diag(A)

M^-1 = diag(1 / A[i,i])
```

For independently chunked CSR input, `GPUJacobiPreconditioner` sums diagonal entries across chunk boundaries and stores the reciprocal. Duplicate diagonal entries follow the same summation convention as SpMV. Missing or zero diagonals produce zero. `GPUElementwise` applies the preconditioner with a multiply:

```
z[i] = inverseDiagonal[i] * r[i]
```

The reciprocal diagonal is constructed once and reused across solver iterations.

Jacobi is deliberately the first preconditioner because it is simple, parallel and exposes the solver architecture without hiding it behind a complicated factorization.

## PCG iteration[​](#pcg-iteration "Direct link to PCG iteration")

With `z = M^-1 r`, PCG becomes:

```
r₀ = b - A x₀

z₀ = M^-1 r₀

p₀ = z₀

ρ₀ = r₀ · z₀



repeat

    q = A p

    α = ρ / (p · q)

    x = x + α p

    r = r - α q



    stop if ||r|| is small enough



    z = M^-1 r

    ρnew = r · z

    β = ρnew / ρ

    p = z + β p

    ρ = ρnew
```

This is intentionally expressed in terms of reusable GPU graph operations:

```
adaptive SpMV ───────────────┐

                             │

hierarchical reduction ─ dot ├─ GPUScalar

                             │      │

Jacobi ─ vector multiply     │   scalar arithmetic

                             │      │

                             └── vector MADD

                                      │

                               GPU convergence gate
```

PCG is therefore a composition test for the GPU graph architecture rather than a private solver kernel.

## Graph API and convergence[​](#graph-api-and-convergence "Direct link to Graph API and convergence")

`GPUJacobiPCG` accepts graph data or vector views for CSR row offsets, column indices, values, right-hand side and solution. The operands can have independent chunk boundaries. Solver scratch follows the right-hand side topology and remains graph-owned. Input storage is borrowed; only the solution and declared scratch are written.

```
import {GPUJacobiPCG} from '@luma.gl/gpgpu/gpu-core/gpu-pcg';



const solver = new GPUJacobiPCG({

  rowOffsets, columnIndices, values, rhs, solution,

  columns: rhs.length,

  iterations: 64,

  toleranceSquared: 1e-12

});

graph.add(solver);

const {initialResidualSquared, residualSquared, breakdown} = solver.getResult();

const compiled = graph.compile();

compiled.encode(encoder, {parameters: undefined});
```

`iterations` is a maximum budget. `toleranceSquared` is an absolute squared residual threshold, defaulting to `1e-12`. Every encoding starts from the current solution and computes `rhs - A * solution`. An already-converged initial guess performs no solver updates. GPU predicates stop later updates when the residual reaches the tolerance; no per-iteration CPU readback is required.

The result scalars can feed later graph operations or explicit diagnostic copies. `breakdown` is nonzero if a nonpositive preconditioned residual product or search curvature prevents a valid step. Such a solve preserves its last valid solution instead of dividing by zero. This is an SPD solver; these checks do not establish that an arbitrary input matrix is positive definite. Small positive curvature and ill-conditioned inputs remain subject to ordinary float32 accuracy limits.

`createGPUConjugateGradientProgram()` provides the unpreconditioned semantic program path. It also checks the initial residual before entering its loop, stops on nonpositive curvature, and returns `residualSquared` and `breakdown` program scalars in addition to its resource bindings.

Both paths use `GPUDotProductScalar`: bounded hierarchical reduction over borrowed spans, optional subgroup reduction, and direct scalar-arena output. Each gated level uses its own exact workgroup count, including multidimensional dispatch and independently chunked vector updates.

## Hero example: interactive Poisson solve[​](#hero-example-interactive-poisson-solve "Direct link to Hero example: interactive Poisson solve")

PCG enables an end-to-end scientific-compute example with a strong visual and architectural story:

```
paint sources / obstacles / boundaries

                 │

                 ▼

           Poisson system

                 │

                 ▼

             sparse CSR

                 │

                 ▼

       Jacobi-preconditioned CG

                 │

                 ▼

          GPU solution field

                 │

       ┌─────────┴──────────┐

       ▼                    ▼

 beauty visualization   engineering view

                           iterations

                           residual

                           SpMV strategy

                           GPU timings
```

The important property is interactivity: changing the domain changes real GPU computation rather than selecting a canned result.

## Future preconditioners[​](#future-preconditioners "Direct link to Future preconditioners")

The solver should accept preconditioners as composable operations rather than encode Jacobi as a permanent special case. More sophisticated options can be considered after the PCG composition and hero workload are proven. Jacobi provides the baseline contract.
