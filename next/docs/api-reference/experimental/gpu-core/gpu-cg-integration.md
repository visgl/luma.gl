# GPU-resident solver integration

## At a glance

| Question                 | Answer                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| **Problem**              | Compose graph-resident conjugate-gradient state and iteration control.                    |
| **Reads / writes**       | Reads matrix-action inputs and solver vectors; updates vectors and arena scalars.         |
| **Ownership**            | Caller-owned vectors surround graph-owned transient vectors and scalar state.             |
| **Output contract**      | A fixed-budget solution update whose convergence state remains on the GPU.                |
| **Expected work**        | Per iteration: matrix-vector action, dot products, scalar arithmetic, and vector updates. |
| **Chunks**               | Solver vectors are explicit packed views with caller-defined partitioning.                |
| **Conditions / budgets** | GPU scalar predicates update indirect dispatch gates for later iterations.                |
| **Neighborhood**         | SpMV contributor + scalar/reduction primitives → conjugate-gradient execution.            |

**Cost**Fixed maximum iteration work, with converged iterations gated on the GPU.

**Common mistake**Do not read residuals to the CPU between iterations.

## Overview[​](#overview "Direct link to Overview")

This integration joins four pieces that are only fully useful together: arena-backed `GPUScalar` values, scalar broadcast vector updates, reductions that write directly to scalars, and GPU-controlled indirect execution. Conjugate gradient is the acceptance workload.

## The complete dataflow[​](#the-complete-dataflow "Direct link to The complete dataflow")

```
vectors r,p,q,x                         graph value arena

──────────────                         ─────────────────

      p ── SpMV ──▶ q

      │              │

      └── dot(p,q) ──┼──────────────▶ pDotQ

      r ── dot(r,r) ─┼──────────────▶ rr

                                      │

                                alpha = rr / pDotQ

                                      │ broadcast

                         ┌────────────┴────────────┐

                         ▼                         ▼

                  x += alpha * p            r -= alpha * q

                                                   │

                                             dot(r,r)

                                                   │

                                              newRR

                                             /     \

                              convergence compare  beta = newRR/rr

                                      │                    │

                                      ▼                    ▼

                               active / gate         p = r + beta*p
```

No coefficient needs to be read back to JavaScript.

## Scalar broadcast and in-place MADD[​](#scalar-broadcast-and-in-place-madd "Direct link to Scalar broadcast and in-place MADD")

`GPUVectorScalarMADD` computes

```
output[i] = scale * input[i] + addend[i]
```

where `scale` is one arena-backed `GPUScalar<float32>`. The scalar is broadcast conceptually across every vector row but occupies only one arena word. Row-local reads happen before the corresponding output write, allowing solver forms such as:

```
x = alpha * p + x

r = -alpha * q + r

p = beta * p + r
```

without transient vectors for the scaled values.

## Reductions become graph values[​](#reductions-become-graph-values "Direct link to Reductions become graph values")

`GPUDotProductScalar` writes the final workgroup reduction directly into a `GPUScalar<float32>` slot rather than a standalone one-element output buffer:

```
GPUVector ─┐

           ├── dot ──▶ GPUScalar in shared arena

GPUVector ─┘
```

This is the important semantic transition from “a reduction happens to produce a one-element vector” to “a reduction produces a scalar graph value.”

## GPU convergence gates[​](#gpu-convergence-gates "Direct link to GPU convergence gates")

WebGPU indirect dispatch stores three workgroup counts in GPU memory. A zero X count causes the following indirect compute dispatch to execute no workgroups. `GPUScalarDispatchGate` turns a `GPUScalar<uint32>` active flag into such a command:

```
active = 1                    active = 0

    │                             │

    ▼                             ▼

[x,y,z] dispatch              [0,y,z] dispatch

    │                             │

    ▼                             ▼

compute executes              compute performs no work
```

The command graph already understands GPU indirect conditions. The gate therefore bridges numerical convergence state into the existing execution model rather than inventing solver-specific CPU control flow.

## Conjugate gradient[​](#conjugate-gradient "Direct link to Conjugate gradient")

The intended iteration is now expressible almost directly from the mathematics:

```
q       = A p

pDotQ   = dot(p,q)

alpha   = rr / pDotQ

x       = alpha*p + x

r       = -alpha*q + r

newRR   = dot(r,r)

active  = newRR > tolerance²

beta    = newRR / rr

p       = beta*p + r

rr      = newRR
```

The configured iteration budget remains a static graph bound. GPU convergence disables later indirect work, so reaching tolerance does not require a CPU readback.

## Binding pressure[​](#binding-pressure "Direct link to Binding pressure")

Vector kernels add only one arena storage binding regardless of how many logical coefficients the solver owns. `rr`, `pDotQ`, `alpha`, `beta`, tolerance and convergence flags all share the graph value arena.

## Performance roadmap[​](#performance-roadmap "Direct link to Performance roadmap")

This PR establishes the integrated execution model, not the final performance ceiling. The next high-leverage work is hierarchical/subgroup reduction, scalar-expression fusion, dispatch-gate coalescing, compiler-driven arena sealing/lifetime reuse, and adaptive SpMV strategy selection.
