import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUBatchHashIndex

<GPUCoreDocsTabs active="batch-hash-index" />

## Overview

`GPUBatchHashIndex` builds one fixed-capacity `uint32` key/value index from an ordered
`GraphVectorView`. Every source chunk retains its existing GPU buffer, physical offset, and record
batch boundary. The index clears its shared table once, processes chunks in source order, and
publishes one cumulative set of build diagnostics without CPU readback or implicit concatenation.

The result implements the same `GPUHashIndexView` contract as `GPUHashIndex`, so
`GPUHashIndexQuery`, `GPUHashJoin`, and `GPUBatchHashJoin` can query it without knowing whether its
right-side source occupied one buffer or many preserved record batches.

<GPUOperationContract operation="gpu-batch-hash-index" />

## Why this feature exists

`GPUHashIndex` accepts one packed `GraphDataView` and clears its table every time its build runs.
Calling it separately for three streamed right-side batches would therefore overwrite the first
two batches. Concatenating those batches beforehand would allocate new storage, copy their rows,
erase their original offsets, and violate streaming ownership.

`GPUBatchHashIndex` instead declares one table initialization followed by one ordered insertion
and value-finalization sequence per nonempty chunk. It keeps source buffers borrowed, preserves
empty batches, and retains the globally earliest source row when duplicate keys span chunks.

Choose it for:

- Arrow record batches arriving from a stream while interactive selections query one logical
  property table.
- Joining scene instances against a dictionary or feature registry split across independently
  owned GPU allocations.
- Preserving discontinuous source IDs such as batch bases `100`, `400`, and `900`.
- Excluding nullable right-side keys without reporting ordinary nulls as invalid hash input.
- Building one reusable sparse index for many left-side lookups or independently bounded joins.

Use [`GPUHashIndex`](/docs/api-reference/experimental/gpu-core/gpu-hash-index) when the
entire right side already occupies one packed chunk. Use
[`GPUBatchHashJoin`](/docs/api-reference/experimental/gpu-core/gpu-batch-hash-join) when the
left side also has several chunks; the right-index choice and left-join choice are independent.

## Construction

```ts
new GPUBatchHashIndex({
  id?,
  keys,
  values?,
  validity?,
  firstValues?,
  tableKeys,
  tableValues,
  statistics,
  maxProbeCount?
});
```

| Property | Purpose |
| --- | --- |
| `keys` | Ordered packed `GraphVectorView<'uint32'>`; original chunks and empty batches are retained. |
| `values` | Optional packed value vector with exactly the same ordered chunk topology as `keys`. |
| `validity` | Optional aligned `uint32` validity vector; zero skips a source row and nonzero includes it. |
| `firstValues` | Optional generated row-ID base for each chunk; cannot be combined with explicit `values`. |
| `tableKeys` | Caller-owned packed unsigned key table with a positive power-of-two capacity. |
| `tableValues` | Caller-owned value table with exactly the same capacity as `tableKeys`. |
| `statistics` | Caller-owned packed unsigned view containing at least six cumulative counters. |
| `maxProbeCount` | Maximum slots examined per included input row; defaults to the table capacity. |
| `id` | Optional prefix used to name initialization and per-chunk graph commands. |

`firstValues` defaults to contiguous logical source offsets. Supply an explicit array when original
record-batch row IDs are discontinuous. An empty chunk still has a corresponding array entry so
batch identity remains unambiguous.

## Index streamed rows and query an interactive selection

Import the already uploaded right-side vector once. The graph preserves its source buffers and
uses caller-owned views for the persistent hash table and diagnostics:

```ts
const rightKeys = graph.importGPUVector('right-feature-ids', featureIdentifierVector);
const rightValidity = graph.importGPUVector('right-key-validity', featureValidityVector);

const featureIndex = new GPUBatchHashIndex({
  id: 'streamed-feature-index',
  keys: rightKeys,
  validity: rightValidity,
  firstValues: [100, 400, 900],
  tableKeys: featureTableKeys,
  tableValues: featureTableValues,
  statistics: featureIndexStatistics,
  maxProbeCount: 32
});
featureIndex.addToGraph(graph);

new GPUHashIndexQuery({
  id: 'lookup-visible-features',
  index: featureIndex,
  keys: selectedFeatureIds,
  values: matchedFeatureRows,
  found: matchedFeatureMask,
  probes: lookupProbeCounts,
  statistics: lookupStatistics
}).addToGraph(graph);

const compiled = graph.compile();
const commandEncoder = device.createCommandEncoder();
compiled.encode(commandEncoder);
device.submit(commandEncoder.finish());
```

`matchedFeatureRows` and `matchedFeatureMask` remain GPU-resident. A later render or compute node
can consume them directly. Reading the six index counters is an optional, explicit diagnostics
operation; it is not performed by the index or the graph.

## Join several left batches against several right batches

The same shared index also composes with a preserved-batch left join:

```ts
const propertyIndex = new GPUBatchHashIndex({
  id: 'property-index',
  keys: rightPropertyIds,
  values: rightPropertyRows,
  validity: rightPropertyValidity,
  tableKeys,
  tableValues,
  statistics: indexStatistics
});
propertyIndex.addToGraph(graph);

new GPUBatchHashJoin({
  id: 'join-instance-batches',
  index: propertyIndex,
  keys: instanceIdentifierBatches,
  outputLeftRows: joinedInstanceRows,
  outputRightRows: joinedPropertyRows,
  counts: requiredMatchCounts,
  overflows: batchOverflows,
  statistics: batchLookupStatistics
}).addToGraph(graph);
```

Left and right chunk topologies do not need to match. Right-side chunks contribute to one shared
index; each left chunk independently preserves its own match capacity, stable row order, required
count, overflow flag, and lookup diagnostics.

## Duplicate, null, and reserved-key semantics

The shared table retains one value per distinct key. Atomic source-row tracking selects the
globally earliest valid occurrence across all chunks. For explicit values, that row contributes
its aligned payload; for generated values, it contributes
`firstValues[chunkIndex] + sourceRowWithinChunk`.

An aligned validity value of zero silently excludes a row. This is different from an included
row whose key is `GPU_HASH_INDEX_EMPTY_KEY` (`0xffffffff`): that key is reserved by the table and
increments the invalid-row counter. Consequently, ordinary nullable keys do not invalidate an
otherwise complete index, while malformed reserved keys remain visible in diagnostics.

Duplicate rows do not generate additional matches. Consumers requiring a unique right-side table
must inspect the duplicate counter and reject or otherwise handle nonzero values; duplicate
expansion and many-to-many joins are intentionally outside this bounded primitive.

## Build statistics and capacity

`statistics` contains six cumulative `uint32` counters across every source chunk:

```text
[unique keys, duplicate rows, overflow rows, invalid rows, total probes, maximum probes]
```

An overflow means at least one included key could not claim a slot within `maxProbeCount`; the
index must not be described as complete in that case. Increase the power-of-two capacity or probe
bound and rebuild. Constructor validation rejects mismatched key/value/validity topology, outputs
that physically overlap, invalid generated row IDs, non-packed views, and workloads whose worst
possible cumulative probe count would overflow the counters.

The implementation stores a global internal source ordinal for deterministic duplicate resolution
while preserving caller-visible generated row IDs from `firstValues`. Empty input clears the table
and counters without requiring a bound source row.

## Ownership, commands, and repeated execution

The application owns all imported input vectors, table buffers, and statistics. The graph owns
its transient source-row bookkeeping and reclaims it when the compiled graph is destroyed.
`GPUBatchHashIndex.addToGraph(graph)` only contributes command-graph nodes; it never compiles the
graph, submits GPU work, copies rows, maps buffers, or destroys caller-owned data.

Each repeated `CompiledGPUCommandGraph.encode()` rebuilds the index by clearing once and replaying
its ordered chunk commands. Compile once when the workload shape is stable, reuse the compiled
graph for successive frames or parameters, and keep imported resources alive until execution has
completed. Shared physical buffers should be imported under one canonical graph handle whenever a
command can write to them; see
[physical buffer overlap and writable aliases](/docs/api-reference/experimental/gpu-core/gpu-command-graph#physical-buffer-overlap-and-writable-aliases).
