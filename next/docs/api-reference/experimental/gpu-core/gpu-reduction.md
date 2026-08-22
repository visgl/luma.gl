# GPUReduction

[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-histogram.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)

## Overview[​](#overview "Direct link to Overview")

`GPUReduction` records a hierarchical reduction over a packed `uint32`, `sint32`, or `float32` graph data view or fixed-width graph vector.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Reduce packed numeric values to a scalar or small fixed result.                                               |
| **Reads / writes**       | Reads uint32, sint32, or float32 values; writes hierarchical summaries and a final value.                     |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | One exact result under the operation and numeric semantics documented by the selected mode.                   |
| **Expected work**        | Linear first-level reads plus logarithmic summary levels.                                                     |
| **Chunks**               | Chunk summaries compose without silently repacking source buffers.                                            |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | values + optional mask → GPUReduction → statistic, condition, or small readback.                              |

**Cost**Bandwidth and summary pass count; only the final output is small.

**Common mistake**Do not assume floating-point reductions are bitwise order-independent.

## Concepts[​](#concepts "Direct link to Concepts")

A reduction combines many scalar rows into one summary. `sum`, `min`, and `max` produce one value; `extent` produces the pair `[minimum, maximum]`. Workgroups first reduce independent blocks, then higher levels reduce those partial results until one row remains. This hierarchy avoids CPU readback. The portable path uses a fixed floating-point tree; a subgroup-capable device may use its native subgroup reduction order and differ in the lowest-order floating-point bits.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Reductions answer whole-input questions that should remain on the GPU: compute an automatic chart domain, total selected bytes or work, find the largest simulated value, or verify a generated count. The one- or two-row result can feed uniforms, histogram domains, allocation decisions with fixed capacity, or a small asynchronous readback.

Use grouped, grid, or histogram aggregation when the result must retain categories, spatial cells, or a distribution. A reduction deliberately discards row identity and intermediate structure; it does not report which row produced a minimum or maximum.

```
new GPUReduction({input: values, output: extent, operation: 'extent'}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
type GPUReductionProps<T extends 'uint32' | 'sint32' | 'float32'> = {

  id?: string;

  input: GraphDataView<T> | GraphVectorView<T>;

  mask?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

  output: GraphDataView<T>;

  operation: 'sum' | 'min' | 'max' | 'extent';

};
```

`sum`, `min`, and `max` require one output row; `extent` writes `[minimum, maximum]` and requires two. Inputs and outputs use separate caller-owned buffers. Hierarchical scratch is graph-owned.

For a `GraphVectorView`, each non-empty `GraphDataView` chunk is reduced independently into graph-owned partial storage, followed by one global reduction. Chunk order and storage remain unchanged; no input is packed or concatenated. An all-empty vector follows the same zero-result behavior as an empty data view.

Integer sums wrap to 32 bits. Floating sums use a 256-way hierarchical reduction. Floating minimum, maximum, and extent ignore NaN and infinity. Empty inputs and all-invalid floating inputs produce zero.

## Reduction hierarchy[​](#reduction-hierarchy "Direct link to Reduction hierarchy")

The reduction is planned in levels. Each level dispatches one 256-thread workgroup for every group of at most 256 input rows, producing one partial row per workgroup. The next level consumes those partial rows. For example, 100,000 input rows produce 391 partial rows, then 2, then 1.

| Stage               | Input                 | Output                             |
| ------------------- | --------------------- | ---------------------------------- |
| First level         | Packed scalar rows    | One partial row per 256 input rows |
| Intermediate levels | Previous partial rows | One partial row per 256 input rows |
| Finalize            | One partial row       | Caller-owned output view           |

`extent` represents each partial row as two adjacent values: minimum and maximum. Floating-point `min`, `max`, and `extent` carry a parallel `uint32` validity row so that NaN and infinity can be ignored without choosing a sentinel value. The finalize pass maps a result with no finite values to zero.

For a multi-chunk vector, each non-empty chunk gets its own hierarchy. The last level of each chunk writes directly into one slot of a shared partial view. A merge hierarchy then reduces those slots. Empty chunks add no passes and do not change the result.

All intermediate views are graph-owned transients. Their declared node uses let the command-graph compiler infer ordering and reuse physical scratch allocations when lifetimes do not overlap.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

**GPUReduction - Benchmark**

**33.55M** uint32 elements/dispatch ·<!-- --> **131,072** reduction blocks

| Implementation        | Supported | Barriers | GPU median | Relative | Element throughput |
| --------------------- | --------- | -------- | ---------- | -------- | ------------------ |
| GPUReduction          | ✓         | 10       | —          | 1.00×    | —                  |
| Subgroup optimization | —         | —        | —          | —        | —                  |

* Each round sums 256 generated uint32 inputs using the workgroup-local operation at the center of a GPUReduction level.
* Throughput is input elements reduced per second.

Workgroups4,096 (4096)Rounds32

Run benchmark

### What the benchmark measures[​](#what-the-benchmark-measures "Direct link to What the benchmark measures")

The benchmark isolates the 256-value workgroup reduction used at each hierarchy level. It reports absolute input throughput and compares the portable and subgroup paths on the same max-feature device.

### Subgroup acceleration[​](#subgroup-acceleration "Direct link to Subgroup acceleration")

When a max-feature device exposes both `subgroups` and the `subgroup_id` WGSL feature, `GPUReduction` uses subgroup collectives before merging subgroup totals in workgroup memory. Other devices keep the portable tree automatically; the API does not change.

### Where it helps[​](#where-it-helps "Direct link to Where it helps")

The fast path also benefits automatic histogram domains, raster statistics, graph summaries, PageRank, and global data-frame aggregations. Gains are largest when synchronization matters; bandwidth-bound graphs may improve less.

## `addToGraph(graph)`[​](#addtographgraph "Direct link to addtographgraph")

Declares reduction levels and a final normalization pass. It does not compile, encode, submit, map, or destroy imported buffers.
