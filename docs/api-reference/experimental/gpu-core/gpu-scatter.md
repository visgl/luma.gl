# GPUScatter

[Scan](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scan.md)[Segmented Scan](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-scan.md)[Scatter](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scatter.md)[Gather](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-gather.md)

## Overview[​](#overview "Direct link to Overview")

`GPUScatter` writes packed fixed-width rows to destinations selected by packed `uint32` indices.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Place packed fixed-width source rows at uint32-selected destination indices.                                  |
| **Reads / writes**       | Reads source rows and indices; writes caller-provided destination rows.                                       |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | A fixed-capacity destination with out-of-range indices ignored.                                               |
| **Expected work**        | One invocation per index and one 32-bit-word copy loop per source row.                                        |
| **Chunks**               | Independent source, index, and destination chunks; destination indices are global.                            |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | source rows + destination indices → GPUScatter → sparse or reordered output.                                  |

**Cost**Memory bandwidth and row width dominate; duplicate destinations may contend.

**Common mistake**Do not expect deterministic results when multiple source rows target one destination.

## Motivation[​](#motivation "Direct link to Motivation")

Scatter is the inverse data-movement primitive to gather. Gather answers “which source row should this output row read?” Scatter answers “where should this source row be written?” It is the natural building block for prefix-sum pipelines, sparse materialization, partitioning, indexed routing, and many graph algorithms that first compute destination offsets and then place payload rows.

Several higher-level `gpu-core` algorithms already contain specialized scatter stages. A standalone primitive makes that operation reusable and gives command graphs one common contract for indexed row movement instead of duplicating format-specific kernels.

## Concepts[​](#concepts "Direct link to Concepts")

For every source row `i`, scatter performs:

```
output[indices[i]] = source[i]
```

when the destination is in range. Out-of-range destinations are ignored. Source and output must use the same packed fixed-width GPU format.

```
graph.add(new GPUScatter({

  source,

  indices,

  output

}));
```

Rows are copied as 32-bit words so floating-point and integer fixed-width formats share one kernel. This keeps the primitive about data movement rather than arithmetic interpretation.

## Duplicate destinations[​](#duplicate-destinations "Direct link to Duplicate destinations")

`GPUScatter` deliberately does not impose conflict-resolution semantics. If multiple source rows write the same destination, those writes race and the final value is unspecified.

That behavior keeps the primitive cheap and matches the fundamental GPU operation. Workflows that need deterministic duplicate handling should first establish unique destinations or use an aggregation/reduction primitive.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use scatter after a stage that has already computed destination indices, for example:

* exclusive scan + scatter for stable compaction
* bucket offsets + scatter for partitioning
* group offsets + scatter for grouped materialization
* sparse index construction
* graph frontier or adjacency routing

Use gather instead when output order determines which source rows to fetch and no destination conflicts are desired.

## Composition[​](#composition "Direct link to Composition")

A canonical stable-filter pipeline is:

```
predicate → flags → exclusive scan → GPUScatter
```

The scan produces unique destination indices for selected rows, eliminating scatter conflicts. That same pattern underlies compaction and many variable-length GPU algorithms.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

Scatter performs one indexed destination lookup and one fixed-width row copy per input row. The initial implementation supports packed rows whose byte length is a multiple of four. It does not allocate scratch resources or perform readback.

Arbitrary duplicate-destination reduction is intentionally outside this primitive; adding atomic or reduction semantics would change both the type constraints and performance model substantially.

## Chunked storage[​](#chunked-storage "Direct link to Chunked storage")

`source`, `indices`, and `output` accept atomic views or independently partitioned vectors. Destination indices address global logical output rows. Lowering intersects source/index boundaries and routes each span to the relevant destination chunks without concatenation. Out-of-range indices are ignored and duplicate destinations remain unordered. Source rows beyond `indices.length` are untouched.
