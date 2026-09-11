import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUScatter

<GPUCoreDocsTabs active="scatter" />

## Overview

`GPUScatter` writes packed fixed-width rows to destinations selected by packed `uint32` indices.

## Motivation

Scatter is the inverse data-movement primitive to gather. Gather answers “which source row should
this output row read?” Scatter answers “where should this source row be written?” It is the natural
building block for prefix-sum pipelines, sparse materialization, partitioning, indexed routing, and
many graph algorithms that first compute destination offsets and then place payload rows.

Several higher-level `gpu-core` algorithms already contain specialized scatter stages. A standalone
primitive makes that operation reusable and gives command graphs one common contract for indexed
row movement instead of duplicating format-specific kernels.

## Concepts

For every source row `i`, scatter performs:

```text
output[indices[i]] = source[i]
```

when the destination is in range. Out-of-range destinations are ignored. Source and output must use
the same packed fixed-width GPU format.

```ts
new GPUScatter({
  source,
  indices,
  output
}).addToGraph(graph);
```

Rows are copied as 32-bit words so floating-point and integer fixed-width formats share one kernel.
This keeps the primitive about data movement rather than arithmetic interpretation.

## Duplicate destinations

`GPUScatter` deliberately does not impose conflict-resolution semantics. If multiple source rows
write the same destination, those writes race and the final value is unspecified.

That behavior keeps the primitive cheap and matches the fundamental GPU operation. Workflows that
need deterministic duplicate handling should first establish unique destinations or use an
aggregation/reduction primitive.

## When to use it

Use scatter after a stage that has already computed destination indices, for example:

- exclusive scan + scatter for stable compaction
- bucket offsets + scatter for partitioning
- group offsets + scatter for grouped materialization
- sparse index construction
- graph frontier or adjacency routing

Use gather instead when output order determines which source rows to fetch and no destination
conflicts are desired.

## Composition

A canonical stable-filter pipeline is:

```text
predicate → flags → exclusive scan → GPUScatter
```

The scan produces unique destination indices for selected rows, eliminating scatter conflicts.
That same pattern underlies compaction and many variable-length GPU algorithms.

## Performance notes

Scatter performs one indexed destination lookup and one fixed-width row copy per input row. The
initial implementation supports packed rows whose byte length is a multiple of four. It does not
allocate scratch resources or perform readback.

Arbitrary duplicate-destination reduction is intentionally outside this primitive; adding atomic or
reduction semantics would change both the type constraints and performance model substantially.
