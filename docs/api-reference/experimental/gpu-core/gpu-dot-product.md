import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUDotProduct and GPUVectorNorm

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUDotProduct` and `GPUVectorNorm` provide canonical scalar reductions for packed `float32` vectors. Dot product computes `sum(a[i] * b[i])`; vector norm computes the Euclidean/L2 norm `sqrt(sum(x[i] * x[i]))`.

## Motivation

General reduction can compute sums, but numerical algorithms repeatedly need these two compound reductions. Treating them as named graph operations makes intent visible to the command graph and avoids private multiply-then-reduce or square-then-reduce kernels with unnecessary intermediate buffers.

They complete the minimal vector algebra needed to begin composing iterative linear solvers with `GPUElementwise`, `GPUMatVec`, and `GPUSpMV`.

## Contract

Both primitives consume packed `float32` views and write one caller-owned `float32` result row.

```ts
new GPUDotProduct({left: x, right: y, output: dot}).addToGraph(graph);
new GPUVectorNorm({input: residual, output: norm}).addToGraph(graph);
```

Inputs remain GPU-resident; neither operation submits work or performs CPU readback.

## Composition

The important target is a solver graph:

```text
GPUSpMV / GPUMatVec
        ↓
GPUElementwise residual update
        ↓
GPUDotProduct / GPUVectorNorm
        ↓
solver scalar state
        ↓
next vector update
```

For conjugate gradient, dot products provide terms such as `r·r` and `p·Ap`; norm provides a natural convergence diagnostic. A solver should be able to keep these scalar values GPU-resident and feed them into later graph nodes rather than forcing a JavaScript synchronization point every iteration.

## Why named operations?

A dot product is mathematically elementwise multiply followed by reduction, and an L2 norm is square, reduce, then square-root. Materializing those intermediate vectors is wasteful. Named operations allow a single kernel today and give a future graph compiler enough semantic information to recognize equivalent compositions and fuse them automatically.

## Performance notes

The baseline uses one 256-thread workgroup. Lanes stride across the entire vector and then perform a workgroup-tree reduction. This avoids intermediate storage and is a useful baseline, but very large vectors will eventually require hierarchical reduction across multiple workgroups for greater parallelism.

Future implementations should share reduction infrastructure with `GPUReduction`, use subgroup collectives when available, and choose strategies based on vector length. Numerically sensitive workloads may also require explicit accumulation-policy choices rather than silently changing precision or reduction order.

## Limitations and roadmap

The initial contract is `float32` only and defines L2 norm only. It does not expose normalization, cosine similarity, L1/L-infinity norms or mixed precision; several of those already overlap with vector-search functionality and should be unified rather than duplicated.

The next roadmap milestone is a graph-native conjugate-gradient solver composed from sparse/dense matvec, elementwise updates and these scalar reductions. The critical architectural requirement is keeping iteration state GPU-resident.

Once the lightweight engine `Kernel` abstraction lands, these primitives should use it instead of `Computation`.
