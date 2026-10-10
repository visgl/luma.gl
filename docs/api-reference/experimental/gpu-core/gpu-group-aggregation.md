import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUGroupAggregation

<GPUCoreDocsTabs active="group-aggregation" />

## Overview

`GPUGroupAggregation` computes counts or floating-point statistics by dense `uint32` group key,
optionally restricted by a GPU-resident selection mask. It answers categorical questions such as
“how many selected requests belong to each service?”, “what is the mean latency of each visible
service?”, or “what value range does each rendered material contribute?” without downloading the
selected rows or rebuilding a CPU group-by.

For `'count'`, the caller supplies a `uint32` output. For `'sum'`, `'min'`, `'max'`, or `'mean'`, the
caller supplies one aligned `float32` value per key and a `float32` output. The output length defines
the number of groups. Group key `i` contributes to output row `i`; keys outside the output range are
ignored.

<GPUOperationContract operation="gpu-group-aggregation" />

## Concepts

Use grouped aggregation for stable categorical summaries: counts by status, mean latency by
service, total bytes by protocol, or extrema by rendered material. The group rows remain stable
while an optional GPU mask changes the participating population, which is especially useful for
linked charts and legends that must track the same interactive selection as a renderer.

It assumes dense integer category IDs and returns one aggregate per category. Use a histogram for
numeric intervals, grid aggregation for spatial cells, or sorting when the application needs the
contributing rows rather than a summary.

### Categories are identities, not numeric ranges

A numeric histogram partitions an ordered domain into intervals. Category codes instead identify
unrelated labels: code `3` may mean “timed out” and code `4` may mean “cancelled”, with no useful
distance between them. Treating those codes as histogram coordinates obscures the real contract,
especially when a dictionary has unused entries or an invalid sentinel.

`GPUGroupAggregation` makes the identity mapping explicit. Valid keys are the dense range
`[0, output.length)`. Applications keep the label dictionary on the CPU while uploading only its
compact unsigned codes. This maps directly to dictionary-encoded Arrow columns without adding an
Arrow dependency to the GPU primitive.

### Counts describe population; statistics describe behavior

A count can show that one service dominates a selected interval, but not whether that service is
slow, expensive, or anomalous. Aligned values let the same stable category rows answer a second
class of questions: sum gives total work or bytes, minimum and maximum expose the observed range,
and mean compares typical magnitude even when group populations differ.

This distinction is why grouped statistics are not modeled as numeric histograms. A latency
histogram explains the shape of one numeric distribution; a grouped mean compares named services.
Applications often need both views over the same GPU-resident selection.

### Filtered groups stay on the GPU

An optional mask has one `uint32` value per key. Zero excludes a row and any nonzero value includes
it. The mask can come from visibility, time-range, bounds, LOD, or selection workflows. Rewriting
an imported mask between encodings updates every group result without recompiling the graph or
reading the selected row IDs back first.

This is useful when group distributions accompany an interactive view. A chart can retain stable
service, status, or object-type rows while their counts respond to the same GPU selection that
drives rendering.

### Chunk preservation and contention

Keys, masks, and values must have equal logical lengths. Each can be a data view or vector with
independent chunk boundaries. Lowering intersects boundaries using borrowed views and preserves
each column's format, byte offset, and stride.
Every non-empty chunk accumulates into shared group rows or partials without concatenation or
repacking. Empty chunks retain their place in the source topology but add no accumulation pass.

Counts with up to 256 groups use workgroup-local atomics before merging into the result; larger
count outputs, minimum, and maximum use global atomics directly. Large input chunks use bounded
three-dimensional dispatches rather than assuming every workgroup fits in one device dimension.

Counts wrap modulo 2^32. Non-finite values are ignored. Minimum and maximum use ordered float
encodings and preserve the documented `-0`/`+0` ordering. Empty sum groups contain positive zero;
empty minimum, maximum, and mean groups contain NaN.

### Deterministic sums and means

Sum and mean use no float atomics. They run in two passes:

1. Each workgroup reduces a fixed block of rows, at least 4,096 rows or the whole chunk when it is
   shorter. It stages each 256-row tile in workgroup memory, sorts the tile by group, and adds each
   group's run with a fixed-shape segmented scan into a per-group accumulator. Each workgroup owns
   one column of a graph-owned `[columnCount × groupCount]` scratch buffer, plus a partial-count
   column for mean.
2. One workgroup per group adds that group's column partials in index order and a fixed binary
   tree, then writes the sum or the mean.

The addition order depends only on the input rows, their chunk boundaries, and the group count.
The same inputs give bitwise-identical results on every run on the same device. This is
deterministic `float32` accumulation, not pairwise summation: tile totals and partials are also
added sequentially, so the usual sequential-summation error bound applies and cancellation can
lose small terms. For example, `2^24`, many `1`s in later tiles, and then `-2^24` can sum to `0`.

Each partial array holds at most about one million values, about 4 MB, regardless of the number
of chunks. Outputs with more than about one million groups use a single column of `groupCount`
values. Row blocks grow beyond 4,096 rows until the largest chunk fits the available columns, but
never grow beyond the largest chunk. Fragmented inputs with more row blocks than columns add later
row blocks into earlier columns in row order. Accumulators live in workgroup memory while they fit
in 8 KB: up to 2,048 sum groups or 1,024 mean groups. Larger outputs accumulate directly in the
workgroup's scratch column, which no other workgroup in the same pass writes. Outputs are limited to
16,777,215 groups, and the graph throws during planning when partial scratch would exceed
`maxStorageBufferBindingSize`.

## Usage

```ts
graph.add([
  new GPUGroupAggregation({
    keys: serviceCodes,
    mask: visibleRequests,
    output: requestCountsByService,
    operation: 'count'
  }),
  new GPUGroupAggregation({
    keys: serviceCodes,
    values: requestLatencies,
    mask: visibleRequests,
    output: meanLatencyByService,
    operation: 'mean'
  })
]);
```

## Constructor

```ts
type GPUGroupAggregationProps = {
  id?: string;
  keys: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  mask?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
} & (
  | {output: GraphDataView<'uint32'>; operation?: 'count'; values?: never}
  | {
      values: GraphDataView<'float32'> | GraphVectorView<'float32'>;
      output: GraphDataView<'float32'>;
      operation: 'sum' | 'min' | 'max' | 'mean';
    }
);
```

`output` must contain at least one group and must not alias the key, mask, or value buffers. Paired
inputs must have equal logical lengths; their view kinds and chunk boundaries may differ. All
inputs and output must belong to the target graph.

The graph owns no persistent result buffer, performs no submission, and introduces no readback.
Out-of-range keys are ignored so callers can use a sentinel such as `0xffffffff` for missing or
unmapped values.

## Performance notes

On subgroup-capable devices, count, minimum, and maximum aggregations with at most 16 groups
combine lanes carrying the same key before issuing atomics. This targets compact dictionaries with
high contention. Sum and mean do not use subgroups or global atomics, so their cost does not depend
on how many rows share a group.
