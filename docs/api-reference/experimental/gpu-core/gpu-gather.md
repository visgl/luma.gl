import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUGather

<GPUCoreDocsTabs active="gather" />

## Overview

`GPUGather` selects or reorders packed fixed-width GPU rows through packed `uint32` source indices.

## Motivation

Indexed gather is one of the basic data-movement operations behind sorting, joins, column
reordering, vector search, sparse algorithms, and GPU-driven rendering. `gpu-core` already contains
specialized uint32 and variable-byte-range gather operations; `GPUGather` provides the missing
fixed-width typed-row primitive so higher-level algorithms do not need to reinterpret every payload
as an application-specific kernel.

## Concepts

For every output row `i`, gather performs:

```text
output[i] = source[indices[i]]
```

An out-of-range source index writes an all-zero row. Source and output must have the same packed
fixed-width GPU format.

```ts
new GPUGather({
  source,
  indices,
  output
}).addToGraph(graph);
```

Rows are copied as 32-bit words. This preserves the bit representation of fixed-width float and
integer rows without making the movement primitive responsible for numeric conversion.

## When to use it

Use gather when an index vector defines output order, including:

- applying a sort permutation to payload columns
- materializing join results
- selecting rows from an index/filter result
- reordering vectors or geometry records
- sparse and graph algorithms with indirect reads

Use `GPUByteRangeGather` for variable-length byte spans and `GPUUint32Gather` when the payload is
specifically a packed uint32 vector and its specialized invalid-value behavior is useful.

## Composition

Gather naturally separates **ordering** from **payload movement**. A sort can produce a permutation
once and the same index vector can then gather several columns independently:

```text
keys ── GPU sort ── permutation
                      ├── gather positions
                      ├── gather colors
                      └── gather metadata
```

This is especially useful for columnar GPU data because payload columns do not need to participate
in the ordering kernel itself.

## Performance notes

Gather performs one indexed source lookup and one fixed-width row copy per output row. The initial
implementation accepts packed rows whose byte length is a multiple of four and does not allocate
scratch resources or read data back to the CPU.
