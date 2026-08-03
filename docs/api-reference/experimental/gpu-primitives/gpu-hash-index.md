import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUHashIndex

<GPUPrimitivesDocsTabs active="hash-index" />

## Overview

`GPUHashIndex` builds a fixed-capacity `uint32` key/value lookup table, and `GPUHashIndexQuery`
looks up a packed batch of keys without submission or CPU readback. Together they provide the
sparse identity lookup that dense group arrays cannot: map stable object IDs to rows, join sparse
feature IDs to attributes, deduplicate identifiers, or resolve categorical dictionaries whose key
space is much larger than their population.

The first contract is deliberately bounded. Capacity is chosen up front, every row examines at
most `maxProbeCount` slots, one key value is reserved as the empty marker, and both build and query
publish collision-work statistics. This makes worst-case GPU work and memory visible to command-
graph consumers instead of hiding resize, allocation, or readback behind a map-like API.

## Concepts

### Sparse identity is different from dense grouping

`GPUGroupAggregation` is ideal when category IDs are dense: group `i` writes output row `i`. That
would be wasteful for object IDs such as `17`, `8042`, and `3900000000`, because a direct-address
array must cover the largest possible ID. A hash index stores only a caller-selected capacity and
turns each sparse key into a bounded sequence of table probes.

This is the useful bridge between GPU-resident datasets. A visibility result can contain stable
object IDs while a property table uses unrelated row numbers; a hash query maps the IDs to rows so
a later compute or render pass can gather attributes. The same mechanism supports sparse joins,
feature registries, selection membership, and dictionary decoding.

### Why hash instead of sort and binary search?

A sorted key/value table offers deterministic layout and logarithmic lookup, and is often better
when ordered traversal or range queries are also required. A hash index targets repeated exact-key
queries: build once, then resolve many changing batches with near-constant expected work. It also
avoids sorting the source solely to establish an identity map.

The tradeoff is explicit. Open addressing becomes more expensive as the table fills, and hostile
or unlucky key distributions can consume the probe limit. The build statistics make that cost
observable so an application can choose a larger capacity, increase the probe bound, or switch to
a sorted representation based on evidence.

### Capacity, probing, and overflow

Capacity must be a positive power of two. Keys are hashed to an initial slot and use linear probing
for at most `maxProbeCount` slots, which defaults to capacity. `0xffffffff` is reserved as
`GPU_HASH_INDEX_EMPTY_KEY`; source rows containing it are counted as invalid and query rows
containing it are reported missing without probing.

The build never resizes. When a distinct key cannot claim or find a slot within the bound, its row
increments the overflow statistic. At capacity, the number of retained distinct keys is exact but
the retained subset is intentionally unspecified because parallel insertion order is not a source-
order contract. Applications that require a particular retained subset must size the table to
avoid overflow or preprocess the keys.

### Duplicate keys retain a deterministic value

Parallel insertion order does not decide duplicate values. Each occupied slot atomically retains
the lowest source-row index, and a final pass copies that row's value. Rebuilding the same inputs
therefore produces the same key-to-value mapping even when workgroups execute in a different
order. When no value input is supplied, the retained value is `firstValue + sourceRow`, making the
primitive directly useful as a key-to-row index.

### Statistics expose the cost model

Build statistics contain:

```text
[unique keys, duplicate rows, overflow rows, invalid rows, total probes, maximum probes]
```

Query statistics contain:

```text
[found keys, missing keys, total probes, maximum probes]
```

The per-query `probes` output supports finer diagnostics. Load factor
`unique / capacity`, average probes, maximum probes, and overflow together indicate whether the
chosen capacity and bound are healthy. Counters are `uint32`; construction rejects workloads whose
maximum aggregate probe count would overflow them.

### Graph ownership and current scope

Callers own the persistent input and output buffers. The build contributes initialization,
parallel insertion, and deterministic value-finalization passes; the graph owns only one transient
source-row buffer. Query contributes statistics initialization and lookup. Neither object compiles,
encodes, submits, resizes, or reads back on its own.

This first slice supports packed `uint32` keys and values and full rebuilds. Deletion and
tombstones, preserved vector chunks, 64-bit keys, custom hash callbacks, partitioned tables, and
join materialization remain future contracts. Starting with exact lookup keeps those additions
grounded in real consumers rather than baking a general-purpose database into the primitive.

## Usage

```ts
const index = new GPUHashIndex({
  keys: objectIds,
  values: objectRows,
  tableKeys,
  tableValues,
  statistics: buildStatistics,
  maxProbeCount: 32
});
index.addToGraph(graph);

new GPUHashIndexQuery({
  index,
  keys: selectedObjectIds,
  values: selectedRows,
  found: selectedRowsFound,
  probes: selectedRowsProbeCounts,
  statistics: queryStatistics
}).addToGraph(graph);
```

To generate row IDs instead of reading an aligned values buffer:

```ts
new GPUHashIndex({
  keys: featureIds,
  firstValue: batchBaseRow,
  tableKeys,
  tableValues,
  statistics: buildStatistics
}).addToGraph(graph);
```

## Constructors

```ts
new GPUHashIndex({
  id?,
  keys,
  values?,
  firstValue?,
  tableKeys,
  tableValues,
  statistics,
  maxProbeCount?
});

new GPUHashIndexQuery({
  id?,
  index,
  keys,
  values,
  found,
  probes,
  statistics,
  maxProbeCount?
});
```

All views are packed `GraphDataView<'uint32'>` values in the target graph. Table key and value
capacities must match, build statistics require six rows, query statistics require four rows, and
aligned query outputs must match the query-key length. Writable views cannot overlap each other or
their read inputs.
