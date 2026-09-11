import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPU reduction substrate

<GPUCoreDocsTabs active="reduction" />

## Why reductions need a hierarchy

A reduction combines many values into fewer values, usually one. A 256-thread workgroup can efficiently combine a few hundred values, but a real GPU vector may contain millions:

```text
1,000,000 input values
        │
        ▼
level 0: ~3907 workgroups → 3907 partial sums
        │
        ▼
level 1: ~16 workgroups   → 16 partial sums
        │
        ▼
level 2: 1 workgroup      → 1 GPUScalar
```

Trying to reduce the entire vector in one workgroup would force each thread to serially process a large fraction of the input and leave most of the GPU idle. Hierarchical reduction exposes parallelism at every level.

## One shared substrate, several mathematical operations

Many apparently different operations have the same structure:

```text
sum(x)       = reduce( x )
dot(x,y)     = reduce( x * y )
norm²(x)     = reduce( x * x )
```

The substrate therefore separates the **first-level map** from the **hierarchical sum**:

```text
input(s)
   │
   ▼
identity / square / multiply
   │
   ▼
workgroup reductions
   │
   ▼
partial rows
   │
   ▼
workgroup reductions
   │
   ▼
GPUScalar
```

This avoids maintaining separate almost-identical reduction kernels for dot products, norms and sums.

## Portable workgroup reduction

The baseline path uses workgroup memory and a binary tree:

```text
8 lanes:  a b c d e f g h
           \ /   \ /   \ /   \ /
4 sums:    ab    cd    ef    gh
             \  /        \  /
2 sums:      abcd        efgh
                  \      /
1 result:        abcdefgh
```

Each stage halves the number of active lanes and synchronizes with `workgroupBarrier()`. This works wherever WebGPU compute works.

## Subgroup fast path

Where the device and WGSL implementation expose subgroups, values inside a hardware subgroup can be combined with `subgroupAdd` without a workgroup-memory tree for those lanes:

```text
workgroup
┌──────── subgroup 0 ────────┐ → subtotal 0
├──────── subgroup 1 ────────┤ → subtotal 1
├──────── subgroup 2 ────────┤ → subtotal 2
└──────── subgroup 3 ────────┘ → subtotal 3
                                  │
                                  ▼
                         small shared reduction
                                  │
                                  ▼
                              workgroup total
```

The public operation does not change. Strategy selection is a backend decision based on device capabilities.

## Relationship to existing GPUReduction

`GPUReduction` on master already implements hierarchical levels and portable/subgroup strategies for its general `sum`, `min`, `max`, and `extent` API. This PR does not create a competing reduction philosophy. It extracts the reusable numerical pattern needed by scalar-producing operations so dot products, norm-squared and solver reductions stop carrying private one-workgroup kernels.

The long-term direction is one shared internal reduction planner/code-generation substrate consumed by `GPUReduction`, dot/norm, segmented operations where applicable, and future numerical algorithms.

## GPUScalar output

Solver reductions should terminate directly in the graph value arena:

```text
r vector ── square ── hierarchy ──▶ rr : GPUScalar<f32>
                                      │
                                      ▼
                                  scalar divide
                                      │
                                      ▼
                                    alpha
```

There is no intermediate one-element vector and no CPU readback.

For convergence, squared norm is usually preferable:

```text
r·r < tolerance²
```

This avoids an unnecessary `sqrt` while preserving the same convergence decision.

## Binding pressure

Intermediate reduction levels use ordinary transient vector storage. Only the final scalar enters the shared graph value arena, so many solver coefficients continue to consume one arena binding rather than one storage-buffer binding each.

## Performance roadmap

The initial reusable substrate establishes hierarchy and subgroup strategy reuse. Further work should be benchmark driven:

- vectorized/coalesced multi-element loads per invocation
- tuned elements-per-thread
- workgroup-size specialization
- subgroup-size-aware final reduction
- fused map/reduction expressions beyond identity/square/multiply
- reduced dispatch overhead between hierarchy levels
- scalar-expression/reduction fusion where profitable
- reuse the same planner inside general `GPUReduction`

The architectural invariant is that **reduction shape and execution strategy belong to shared infrastructure, not to each mathematical operation independently**.
