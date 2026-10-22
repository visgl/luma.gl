# Compositional GPU architecture

## At a glance

| Question                 | Answer                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **Problem**              | Compose higher-level GPU algorithms from a shared set of execution primitives.                     |
| **Reads / writes**       | Each composed contributor declares its own resource reads and writes to the graph.                 |
| **Ownership**            | Ownership remains explicit at primitive and graph boundaries.                                      |
| **Output contract**      | A reusable graph topology whose stages retain their individual contracts.                          |
| **Expected work**        | The sum of contributed stages, with shared planners providing optimization leverage.               |
| **Chunks**               | Preserves declared views and source identity; it does not implicitly concatenate or repack chunks. |
| **Conditions / budgets** | Composition preserves graph conditions, budgets, encoding, and submission boundaries.              |
| **Neighborhood**         | GPU primitives → composed algorithms → application-owned execution.                                |

**Cost**Extra stages can add dispatches until benchmark-driven fusion is introduced.

**Common mistake**Do not create a private execution subsystem when existing graph primitives compose cleanly.

## Overview[​](#overview "Direct link to Overview")

The GPU compute library is intentionally built from a relatively small set of reusable execution patterns. Higher-level algorithms should compose those patterns instead of introducing a private GPU subsystem for every domain.

This matters for both API coherence and performance: when many algorithms share the same scan, reduction, segmented-data, sorting, scalar-state, and indirect-execution machinery, improvements to those foundations benefit the whole library.

## A small vocabulary, many algorithms[​](#a-small-vocabulary-many-algorithms "Direct link to A small vocabulary, many algorithms")

The same primitives recur across numerical computing, sparse algebra, graph processing, columnar analytics, parsing, and visualization pipelines.

```
                         COMMON GPU VOCABULARY



   scan       reduction       sort        gather/scatter

    │             │            │               │

    ├──────┐      ├─────┐      ├──────┐        ├────────┐

    ▼      ▼      ▼     ▼      ▼      ▼        ▼        ▼

compact  offsets  dot  norm   RLE   group-by  COO     routing

    │      │       └──┬──┘      └──┬───┘        │        │

    ▼      ▼          ▼            ▼            ▼        ▼

filtered segmented  solvers     analytics    COO→CSR   graph work

 data    data                       │            │

            │                       │            ▼

            ├──────────────┐        │           CSR

            ▼              ▼        ▼            ▼

        Arrow lists   adjacency   summaries     SpMV

            │              │                     │

            └──────────────┴─────────────────────┤

                                                ▼

                                           CG / PCG
```

The objective is not to minimize the number of public operations at all costs. It is to ensure that higher-level operations are implemented using a small number of deeply optimized execution families.

## Offset-delimited segments[​](#offset-delimited-segments "Direct link to Offset-delimited segments")

One of the clearest examples of reuse is the representation

```
values  = [ ... packed values ... ]

offsets = [0, ..., N]
```

where logical item `i` owns `[offsets[i], offsets[i + 1])`.

The same structure appears as:

```
offset-delimited segments

        │

        ├── CSR sparse-matrix rows

        ├── graph adjacency lists

        ├── Arrow/List-style variable-length values

        ├── grouped analytics buckets

        └── segmented scan/reduction inputs
```

Calling this general representation "CSR-style" would hide the larger architectural connection. CSR is one application of offset-delimited segments.

## Hierarchical reduction[​](#hierarchical-reduction "Direct link to Hierarchical reduction")

Another shared execution family is reduction:

```
sum(x)      = reduce(x)

dot(x,y)    = reduce(x * y)

norm²(x)    = reduce(x * x)

min/max     = reduce with different combine semantics

extent      = paired min/max reduction
```

For large inputs, physical execution is hierarchical:

```
1,000,000 values

      ↓

~3907 workgroup partials

      ↓

~16 partials

      ↓

1 result
```

Portable workgroup trees and subgroup collectives are execution strategies beneath this common hierarchy. Optimizing hierarchy planning, subgroup use, elements per thread, or workgroup sizing can therefore improve statistics, numerical solvers, analytics, and other operations simultaneously.

## Sorting, runs, grouping, and sparse construction[​](#sorting-runs-grouping-and-sparse-construction "Direct link to Sorting, runs, grouping, and sparse construction")

Sorting is similarly foundational:

```
COO entries ── sort(row,column) ── RLE rows ── offsets ── CSR

keys ───────── sort ────────────── RLE ─────── grouped runs

records ────── sort ────────────── boundaries ─ segmented reduction
```

`GPURunLengthEncode` is not merely a compression utility. It turns ordered equal values into group structure. Combined with scans and segmented operations it becomes infrastructure for sparse matrices and analytics.

## GPU scalar state[​](#gpu-scalar-state "Direct link to GPU scalar state")

Iterative and GPU-driven algorithms share small state:

```
CG coefficients       alpha, beta

reduction results     r·r, p·Ap

algorithm counters    iteration, count

predicates             active, converged

indirect execution     workgroup counts
```

These should not become separate storage-buffer bindings. They are logical values packed into the graph-owned `GPUValueArena`:

```
GPUValueArena

┌────────────────────────────┐

│ alpha       f32     @ 0    │

│ beta        f32     @ 4    │

│ residual²   f32     @ 8    │

│ active      u32     @ 12   │

│ iteration   u32     @ 16   │

└────────────────────────────┘

          one physical arena
```

The distinction is important: a `GPUScalar` is a logical graph value, not a physical buffer.

### Stable offsets are intentional[​](#stable-offsets-are-intentional "Direct link to Stable offsets are intentional")

Small arena values use monotonic allocation and retain the same offset for the lifetime of the graph. We deliberately do **not** recycle scalar slots merely because two logical values are live at different times.

The memory saving would normally be negligible: even 1,000 32-bit values occupy only about 4 KB. Stable offsets, however, make generated WGSL, preflight reports, traces, debugger inspection, and failure diagnostics substantially easier to understand:

```
alpha       always @ 0

beta        always @ 4

residual²   always @ 8

active      always @ 12
```

The arena exists primarily to solve **binding pressure**, not scalar-memory pressure. Many logical values share one storage-buffer binding while remaining individually inspectable.

## Conjugate gradient as a composition test[​](#conjugate-gradient-as-a-composition-test "Direct link to Conjugate gradient as a composition test")

Conjugate gradient is useful because its mathematics maps almost directly onto the primitive vocabulary:

```
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

## Graph algorithms share the sparse substrate[​](#graph-algorithms-share-the-sparse-substrate "Direct link to Graph algorithms share the sparse substrate")

A CSR sparse matrix and a graph adjacency list are structurally close:

```
CSR matrix                       graph adjacency

----------                       ---------------

rowOffsets                       vertexOffsets

columnIndices                    neighborIds

values                           optional edge data
```

This means sparse numerical infrastructure can support graph workloads without pretending the two domains are identical. Offset traversal, segmented reductions, sparse gathers, sorting, and compaction can be shared while matrix arithmetic and graph semantics remain separate higher-level operations.

## Columnar analytics share the grouping substrate[​](#columnar-analytics-share-the-grouping-substrate "Direct link to Columnar analytics share the grouping substrate")

Columnar analytics repeatedly needs:

```
filter → compact

sort → identify groups

run boundaries → offsets

group offsets → segmented aggregate
```

Those are the same execution families used elsewhere:

```
analytics       sparse algebra       graph processing

---------       --------------       ----------------

compact         COO construction     frontier compact

sort            COO canonicalize     edge ordering

RLE             row grouping         adjacency grouping

segments        CSR rows             adjacency lists

reduction       dot/norm             degree/weight sums
```

This convergence is intentional. It is one reason the GPU core should remain focused on reusable execution patterns rather than domain-specific naming.

## Physical reuse belongs where memory is large[​](#physical-reuse-belongs-where-memory-is-large "Direct link to Physical reuse belongs where memory is large")

Lifetime-based aliasing is valuable, but the useful target is large transient storage rather than tiny arena values.

```
reduction scratch       tens of KB or more

sort scratch            hundreds of KB / MB

FFT temporaries         MB

solver vectors          MB
```

For example:

```
node:       0 1 2 3 4 5 6 7 8

sort temp:    ├───────┤

FFT temp:               ├─────┤
```

If two large transient resources cannot overlap in execution, the graph compiler may eventually map them onto the same physical allocation. Saving megabytes can justify the additional aliasing complexity.

This gives the architecture two deliberately different policies:

```
small GPU values       → stable monotonic arena slots

large transient data   → candidate for lifetime-based physical reuse
```

Debuggability wins when memory savings are trivial; memory planning wins when savings are material.

## Optimization leverage[​](#optimization-leverage "Direct link to Optimization leverage")

A compositional architecture creates leverage. Improving one substrate can improve many higher-level operations:

```
OPTIMIZATION                     BENEFICIARIES



subgroup reduction       → reduction, dot, norm, CG, analytics

segmented kernels        → CSR, graphs, Arrow lists, group-by

sort/RLE                 → sparse construction, grouping, analytics

arena packing            → solvers, counters, conditions, indirect work

transient buffer reuse   → memory-heavy graph pipelines

fusion                   → elementwise chains, solvers, transforms

adaptive dispatch        → SpMV, reductions, scans, irregular workloads
```

This is the central architectural goal: **higher-level breadth should increase optimization leverage rather than multiply unrelated implementations.**

## Design test for new operations[​](#design-test-for-new-operations "Direct link to Design test for new operations")

When adding a new high-level operation, ask:

1. Which existing execution families does it decompose into?
2. Does it expose a genuinely new reusable primitive, or only a new composition?
3. Can its temporary state live in existing graph-managed storage?
4. Can its control decisions remain GPU-resident?
5. Will optimizing this implementation improve other operations too?

A new primitive is justified when it captures a reusable execution pattern. Otherwise the preferred implementation is composition.
