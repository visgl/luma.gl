# Compositional GPU architecture

## Overview

The GPU compute library is intentionally built from a relatively small set of reusable execution patterns. Higher-level algorithms should compose those patterns instead of introducing a private GPU subsystem for every domain.

This matters for both API coherence and performance: when many algorithms share the same scan, reduction, segmented-data, sorting, scalar-state, and indirect-execution machinery, improvements to those foundations benefit the whole library.

## A small vocabulary, many algorithms

The same primitives recur across numerical computing, sparse algebra, graph processing, columnar analytics, parsing, and visualization pipelines.

```text
                         COMMON GPU VOCABULARY

   scan       reduction       sort        gather/scatter
    │             │            │               │
    │             │            │               │
    ├──────┐      ├─────┐      ├──────┐        ├────────┐
    │      │      │     │      │      │        │        │
    ▼      ▼      ▼     ▼      ▼      ▼        ▼        ▼
compact  offsets  dot  norm   RLE   group-by  COO     routing
    │      │       │     │      │      │        │        │
    │      │       └──┬──┘      └──┬───┘        │        │
    │      │          │            │            │        │
    ▼      ▼          ▼            ▼            ▼        ▼
filtered segmented  solvers     analytics    COO→CSR   graph work
 data    data                       │            │
            │                       │            ▼
            ├──────────────┐        │           CSR
            │              │        │            │
            ▼              ▼        ▼            ▼
        Arrow lists   adjacency   summaries     SpMV
            │              │                     │
            └──────────────┴─────────────────────┤
                                                ▼
                                           CG / PCG
```

The objective is not to minimize the number of public operations at all costs. It is to ensure that higher-level operations are implemented using a small number of deeply optimized execution families.

## Offset-delimited segments

One of the clearest examples of reuse is the representation

```text
values  = [ ... packed values ... ]
offsets = [0, ..., N]
```

where logical item `i` owns `[offsets[i], offsets[i + 1])`.

The same structure appears as:

```text
offset-delimited segments
        │
        ├── CSR sparse-matrix rows
        ├── graph adjacency lists
        ├── Arrow/List-style variable-length values
        ├── grouped analytics buckets
        └── segmented scan/reduction inputs
```

Calling this general representation "CSR-style" would hide the larger architectural connection. CSR is one application of offset-delimited segments.

## Hierarchical reduction

Another shared execution family is reduction:

```text
sum(x)      = reduce(x)
dot(x,y)    = reduce(x * y)
norm²(x)    = reduce(x * x)
min/max     = reduce with different combine semantics
extent      = paired min/max reduction
```

For large inputs, the physical execution is hierarchical:

```text
1,000,000 values
      │
      ▼
~3907 workgroup partials
      │
      ▼
~16 partials
      │
      ▼
1 result
```

Portable workgroup trees and subgroup collectives are execution strategies beneath this common hierarchy. Optimizing hierarchy planning, subgroup use, elements per thread, or workgroup sizing can therefore improve statistics, numerical solvers, analytics, and other operations simultaneously.

## Sorting, runs, grouping, and sparse construction

Sorting is similarly foundational:

```text
COO entries ── sort(row,column) ── RLE rows ── offsets ── CSR

keys ───────── sort ────────────── RLE ─────── grouped runs

records ────── sort ────────────── boundaries ─ segmented reduction
```

`GPURunLengthEncode` is not merely a compression utility. It turns ordered equal values into group structure. Combined with scans and segmented operations it becomes infrastructure for sparse matrices and analytics.

## GPU scalar state

Iterative and GPU-driven algorithms also share small state:

```text
CG coefficients       alpha, beta
reduction results     r·r, p·Ap
algorithm counters    iteration, count
predicates             active, converged
indirect execution     workgroup counts
```

These should not become separate storage-buffer bindings. They are logical values packed into the graph-owned `GPUValueArena`:

```text
GPUValueArena
┌────────────────────────────┐
│ alpha       f32            │
│ beta        f32            │
│ residual²   f32            │
│ active      u32            │
│ iteration   u32            │
└────────────────────────────┘
          one physical arena
```

The distinction is important: a `GPUScalar` is a logical graph value, not a physical buffer.

## Conjugate gradient as a composition test

Conjugate gradient is useful because its mathematics maps almost directly onto the primitive vocabulary:

```text
q = A p                         SpMV
rr = r · r                      hierarchical reduction
pq = p · q                      hierarchical reduction
alpha = rr / pq                 scalar arithmetic
x = x + alpha p                 scalar-broadcast MADD
r = r - alpha q                 scalar-broadcast MADD
newRR = r · r                   hierarchical reduction
active = newRR > tolerance²     scalar comparison
beta = newRR / rr               scalar arithmetic
p = r + beta p                  scalar-broadcast MADD
                                GPU indirect gate → next iteration
```

If CG required a large private WGSL implementation, the abstraction would have failed. Its value as an architectural test is that the solver can mostly orchestrate reusable graph operations.

## Graph algorithms share the sparse substrate

A CSR sparse matrix and a graph adjacency list are structurally close:

```text
CSR matrix                       graph adjacency
----------                       ---------------
rowOffsets                       vertexOffsets
columnIndices                    neighborIds
values                           optional edge data
```

This means sparse numerical infrastructure can support graph workloads without pretending the two domains are identical. Offset traversal, segmented reductions, sparse gathers, sorting, and compaction can be shared while matrix arithmetic and graph semantics remain separate higher-level operations.

## Columnar analytics share the grouping substrate

Columnar analytics repeatedly needs:

```text
filter → compact
sort → identify groups
run boundaries → offsets
group offsets → segmented aggregate
```

Those are the same execution families used elsewhere:

```text
analytics       sparse algebra       graph processing
---------       --------------       ----------------
compact         COO construction     frontier compact
sort            COO canonicalize     edge ordering
RLE             row grouping         adjacency grouping
segments        CSR rows             adjacency lists
reduction       dot/norm             degree/weight sums
```

This convergence is intentional. It is one reason the GPU core should remain focused on reusable execution patterns rather than domain-specific naming.

## Physical reuse beneath logical reuse

The command graph can also reuse storage. Consider two temporary scalars:

```text
node:     0 1 2 3 4 5 6 7 8
alpha:        ├───────┤
temp:                   ├─────┤
```

Their lifetimes do not overlap, so they can share one physical arena slot:

```text
logical values                 physical arena

alpha  ───────┐
              ├──────────────▶ slot 3
laterTemp ────┘
```

This is analogous to register allocation at graph-resource scale. The application should reason about logical values; the compiler should increasingly own packing, lifetime analysis, and physical reuse.

The same principle can later extend beyond the small-value arena to transient vectors and algorithm scratch.

## Optimization leverage

A compositional architecture creates leverage. Improving one substrate can improve many higher-level operations:

```text
OPTIMIZATION                     BENEFICIARIES

subgroup reduction       → reduction, dot, norm, CG, analytics
segmented kernels        → CSR, graphs, Arrow lists, group-by
sort/RLE                 → sparse construction, grouping, analytics
arena packing            → solvers, counters, conditions, indirect work
lifetime reuse           → every graph with transient state
fusion                   → elementwise chains, solvers, transforms
adaptive dispatch        → SpMV, reductions, scans, irregular workloads
```

This is the central architectural goal: **higher-level breadth should increase optimization leverage rather than multiply unrelated implementations.**

## Design test for new operations

When adding a new high-level operation, ask:

1. Which existing execution families does it decompose into?
2. Does it expose a genuinely new reusable primitive, or only a new composition?
3. Can its temporary state live in existing graph-managed storage?
4. Can its control decisions remain GPU-resident?
5. Will optimizing this implementation improve other operations too?

A new primitive is justified when it captures a reusable execution pattern. Otherwise the preferred implementation is composition.
