import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUGather

<GPUCoreDocsTabs active="gather" />

<GPUOperationContract operation="gpu-gather" />

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
fixed-width GPU format. `GPUUint32Gather` follows the same batching contract, with a configurable
`invalidValue` (default `0`) instead of a zero-filled row.

```ts
graph.add(new GPUGather({
  source,
  indices,
  output
}));
```

Rows are copied as 32-bit words. This preserves the bit representation of fixed-width float and
integer rows without making the movement primitive responsible for numeric conversion.

## Batching contract

`source`, `indices`, and `output` accept either `GraphDataView` or `GraphVectorView`, independently.
Source indices address the global logical source row, including across chunk boundaries. The
source length may differ from the index count. Index order and duplicate indices are preserved.

Output capacity must cover the index count. Only that prefix is written; spare rows and padding
remain untouched. Empty indices perform no writes. An empty source fills the active destination
with invalid rows. Empty chunks do not contribute logical rows. Every encoding rebuilds results,
so source values and indices may change without recompiling when their layout stays fixed.

Chunks must contain packed rows with four-byte-aligned offsets and row widths divisible by four.
This includes fixed-size-list rows. Output storage must use buffers separate from every source
and index chunk, and output chunks must not overlap one another. Variable-length and strided rows
remain outside this operation's contract.

## When to use it

Use gather when an index vector defines output order, including:

- applying a sort permutation to payload columns
- materializing join results
- selecting rows from an index/filter result
- reordering vectors or geometry records
- sparse and graph algorithms with indirect reads

Use `GPUByteRangeGather` for variable-length byte spans and `GPUUint32Gather` when the payload is
specifically a packed uint32 vector and its specialized invalid-value behavior is useful.

### Byte ranges

```ts
graph.add(new GPUByteRangeGather({
  source, sourceOffsets, lengths, outputOffsets, output,
  sourceByteLength, outputByteCapacity
}));
```

All five operands accept packed `uint32` atomic views or independently chunked vectors. Source
and output lengths count words; offsets, range lengths, and capacities count bytes in the logical
concatenation of those words. Physical chunk boundaries are word-aligned; any padding inside a
source chunk is part of that logical byte sequence. `sourceByteLength` excludes final source padding.

The three metadata columns have equal logical lengths. Each output range must start at or after
the preceding range's end, including empty ranges; a zero-length range may share its offset with
the following range. Source ranges may overlap, repeat,
or cross chunks. These GPU-resident range ordering requirements are caller-owned. Invalid source
addresses and output gaps produce zero bytes, and ranges are clipped to `outputByteCapacity`.

Each encoding rewrites `ceil(outputByteCapacity / 4)` output words, clearing unused bytes in the
final word. Additional words remain untouched. Empty metadata or zero capacity adds no commands;
an empty source with nonempty metadata fills the active output words with zero. Output storage
must be separate from source and metadata, and output chunks must not overlap.

Lowering borrows aligned metadata spans and dispatches each source/span pair over each output
chunk. A single invocation owns an entire output word, accumulating bytes across passes without
write races or scratch allocation. Atomic operands retain one pass. The number of dispatches grows
with the product of source chunks, metadata spans, and output chunks; optimizing routing for heavily
fragmented data remains follow-up work.

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

Lowering aligns index and output boundaries using borrowed views, then dispatches one pass per
nonempty source chunk for each aligned span. Each pass scans that span's indices, copying rows
whose global index belongs to its source chunk. The first source pass initializes invalid rows;
later passes preserve rows outside their source range. An empty source uses an output-only fill.

This keeps each pass at no more than three storage bindings, within WebGPU CORE limits, without
concatenation, scratch buffers, or CPU readback. Index traversal and dispatch count grow with the
number of source chunks; optimizing this routing for very fragmented sources remains follow-up
work. Atomic input retains a single gather pass when indices and output form one span.


## Chunked storage

Source, index, and output chunks may differ. Fixed-width source rows may also have a word-aligned stride larger than the row payload; only payload words are copied. Indices and output remain packed. All indices are global logical source rows, and out-of-range indices produce zero rows.
