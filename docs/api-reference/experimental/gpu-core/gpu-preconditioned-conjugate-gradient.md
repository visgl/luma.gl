# Preconditioned conjugate gradient

Conjugate gradient (CG) solves sparse symmetric positive-definite systems `Ax = b`. Preconditioned conjugate gradient (PCG) applies an inexpensive approximation to `A^-1` so that the transformed problem converges in fewer iterations.

## Why preconditioning matters

CG convergence depends on the spectrum of the matrix. Poorly conditioned systems may require many iterations even though every individual iteration is inexpensive. A preconditioner `M` approximates `A` while remaining much cheaper to invert.

```text
A x = b
  │
  ├── residual r = b - A x
  │
  ├── solve approximately M z = r
  │
  └── use z to choose the next search direction
```

A useful preconditioner therefore trades a little additional work per iteration for substantially fewer iterations.

## Jacobi preconditioning

The Jacobi preconditioner keeps only the diagonal of the matrix:

```text
M = diag(A)
M^-1 = diag(1 / A[i,i])
```

For CSR input, `GPUJacobiPreconditioner` scans each row once to find its diagonal entry and stores the reciprocal diagonal. `GPUApplyJacobiPreconditioner` then applies the preconditioner with one elementwise multiply:

```text
z[i] = inverseDiagonal[i] * r[i]
```

The reciprocal diagonal is constructed once and reused across solver iterations.

Jacobi is deliberately the first preconditioner because it is simple, parallel and exposes the solver architecture without hiding it behind a complicated factorization.

## PCG iteration

With `z = M^-1 r`, PCG becomes:

```text
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

```text
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

## Hero example: interactive Poisson solve

PCG enables an end-to-end scientific-compute example with a strong visual and architectural story:

```text
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

## Future preconditioners

The solver should accept preconditioners as composable operations rather than encode Jacobi as a permanent special case. More sophisticated options can be considered after the PCG composition and hero workload are proven. Jacobi provides the baseline contract.