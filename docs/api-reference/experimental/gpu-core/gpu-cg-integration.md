# GPU-resident solver integration

## Overview

This integration joins four pieces that are only fully useful together: arena-backed `GPUScalar` values, scalar broadcast vector updates, reductions that write directly to scalars, and GPU-controlled indirect execution. Conjugate gradient is the acceptance workload.

## The complete dataflow

```text
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

## Scalar broadcast and in-place MADD

`GPUVectorScalarMADD` computes

```text
output[i] = scale * input[i] + addend[i]
```

where `scale` is one arena-backed `GPUScalar<float32>`. The scalar is broadcast conceptually across every vector row but occupies only one arena word. Row-local reads happen before the corresponding output write, allowing solver forms such as:

```text
x = alpha * p + x
r = -alpha * q + r
p = beta * p + r
```

without transient vectors for the scaled values.

## Reductions become graph values

`GPUDotProductScalar` writes the final workgroup reduction directly into a `GPUScalar<float32>` slot rather than a standalone one-element output buffer:

```text
GPUVector ─┐
           ├── dot ──▶ GPUScalar in shared arena
GPUVector ─┘
```

This is the important semantic transition from “a reduction happens to produce a one-element vector” to “a reduction produces a scalar graph value.”

## GPU convergence gates

WebGPU indirect dispatch stores three workgroup counts in GPU memory. A zero X count causes the following indirect compute dispatch to execute no workgroups. `GPUScalarDispatchGate` turns a `GPUScalar<uint32>` active flag into such a command:

```text
active = 1                    active = 0
    │                             │
    ▼                             ▼
[x,y,z] dispatch              [0,y,z] dispatch
    │                             │
    ▼                             ▼
compute executes              compute performs no work
```

The command graph already understands GPU indirect conditions. The gate therefore bridges numerical convergence state into the existing execution model rather than inventing solver-specific CPU control flow.

## Conjugate gradient

The intended iteration is now expressible almost directly from the mathematics:

```text
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

## Binding pressure

Vector kernels add only one arena storage binding regardless of how many logical coefficients the solver owns. `rr`, `pDotQ`, `alpha`, `beta`, tolerance and convergence flags all share the graph value arena.

## Performance roadmap

This PR establishes the integrated execution model, not the final performance ceiling. The next high-leverage work is hierarchical/subgroup reduction, scalar-expression fusion, dispatch-gate coalescing, compiler-driven arena sealing/lifetime reuse, and adaptive SpMV strategy selection.
