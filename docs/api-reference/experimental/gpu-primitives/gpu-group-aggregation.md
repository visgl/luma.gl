import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUGroupAggregation

<GPUPrimitivesDocsTabs active="group-aggregation" />

## Overview

`GPUGroupAggregation` counts rows by dense `uint32` group key, optionally restricted by a
GPU-resident selection mask. It answers categorical questions such as “how many selected requests
belong to each service?”, “which status classes dominate this filtered interval?”, or “how many
visible objects use each material?” without downloading the selected rows or rebuilding a CPU
group-by.

The output is a caller-owned `uint32` view whose length defines the number of groups. Group key
`i` increments output row `i`; keys outside the output range are ignored. The initial operation is
`'count'`. Sum, minimum, maximum, and mean are deliberately reserved for a later tranche so their
value formats, empty-group behavior, and floating-point contracts can build on an exercised
categorical foundation.

## Concepts

### Categories are identities, not numeric ranges

A numeric histogram partitions an ordered domain into intervals. Category codes instead identify
unrelated labels: code `3` may mean “timed out” and code `4` may mean “cancelled”, with no useful
distance between them. Treating those codes as histogram coordinates obscures the real contract,
especially when a dictionary has unused entries or an invalid sentinel.

`GPUGroupAggregation` makes the identity mapping explicit. Valid keys are the dense range
`[0, output.length)`. Applications keep the label dictionary on the CPU while uploading only its
compact unsigned codes. This maps directly to dictionary-encoded Arrow columns without adding an
Arrow dependency to the GPU primitive.

### Filtered groups stay on the GPU

An optional mask has one `uint32` value per key. Zero excludes a row and any nonzero value includes
it. The mask can come from visibility, time-range, bounds, LOD, or selection workflows. Rewriting
an imported mask between encodings updates every group count without recompiling the graph or
reading the selected row IDs back first.

This is useful when group distributions accompany an interactive view. A chart can retain stable
service, status, or object-type rows while their counts respond to the same GPU selection that
drives rendering.

### Chunk preservation and contention

For `GraphVectorView` inputs, keys and masks must have identical ordered chunk lengths. Every
encoding clears the output once, then each non-empty chunk accumulates into the shared group rows
without concatenation or repacking. Empty chunks retain their place in the source topology but add
no compute pass.

Up to 256 groups use workgroup-local atomics before merging into the result. Larger outputs use
global atomics directly. This keeps small, highly contended dictionaries efficient while avoiding
unbounded workgroup storage. Counts wrap modulo 2^32, matching `uint32` atomic addition.

## Usage

```ts
new GPUGroupAggregation({
  keys: serviceCodes,
  mask: visibleRequests,
  output: requestCountsByService,
  operation: 'count'
}).addToGraph(graph);
```

## Constructor

```ts
type GPUGroupAggregationProps = {
  id?: string;
  keys: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  output: GraphDataView<'uint32'>;
  mask?: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  operation?: 'count';
};
```

`output` must contain at least one group and must not alias the key or mask buffers. Keys and masks
must use the same atomic/vector view kind and, for vectors, identical chunk topology. Inputs and
output must belong to the target graph.

The graph owns no persistent result buffer, performs no submission, and introduces no readback.
Out-of-range keys are ignored so callers can use a sentinel such as `0xffffffff` for missing or
unmapped values.
