import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUDotProduct and GPUVectorNorm

<GPUCoreDocsTabs active="reduction" />

## Dot product

The dot product multiplies corresponding vector elements and sums the products:

```text
a = [1, 2, 3]
b = [4, 5, 6]

       1*4 + 2*5 + 3*6
              ↓
a · b =       32
```

Formally:

```text
a · b = Σ a[i] b[i]
```

It turns two vectors into one scalar. Geometrically it also measures directional alignment: orthogonal vectors have dot product zero. In numerical algorithms it appears constantly in projections, residual calculations and iterative solvers.

A dot product can be viewed computationally as:

```text
a ─┐
   × elementwise ─▶ [products] ─▶ sum reduction ─▶ scalar
b ─┘
```

`GPUDotProduct` fuses those stages so the intermediate product vector need not be materialized.

## Vector norm

The Euclidean or L2 norm is the ordinary geometric length of a vector:

```text
x = [3, 4]

||x||₂ = sqrt(3² + 4²) = 5
```

Formally:

```text
||x||₂ = sqrt(x · x)
       = sqrt(Σ x[i]²)
```

For solver residuals, the norm answers a useful question: **how large is the remaining error vector?**

```text
residual r
    ↓
r · r
    ↓
sqrt
    ↓
||r||₂
```

## Why these are GPU scalars

Both operations consume potentially huge vectors but produce exactly one value. That scalar should remain GPU-resident when it feeds later work:

```text
GPUVector r ─▶ GPUDotProduct ─▶ GPU scalar rr
                                      │
                                      ▼
                              solver coefficient
                                      │
                                      ▼
                                vector update
```

Reading the scalar to JavaScript between solver stages would introduce synchronization.

## Contract

```ts
new GPUDotProduct({left: x, right: y, output: dot}).addToGraph(graph);
new GPUVectorNorm({input: residual, output: norm}).addToGraph(graph);
```

The initial contract uses packed `float32` vectors and writes one caller-owned `float32` result row.

## Solver composition

Conjugate gradient uses dot products directly:

```text
rr   = r · r
pAp  = p · (A p)
alpha = rr / pAp
```

and can use the residual norm as a convergence diagnostic:

```text
||r||₂ < tolerance
```

This is why dot/norm operations are more than convenience wrappers: they connect vector computation to GPU-resident scalar state and graph control.

## Performance notes

The baseline uses one 256-thread workgroup. Lanes stride across the vector and perform a workgroup-tree reduction. Very large vectors eventually need hierarchical multi-workgroup reduction and subgroup collectives.

Floating-point addition is not associative, so parallel reduction order can produce small numerical differences. Tests should use tolerances rather than bitwise equality.
