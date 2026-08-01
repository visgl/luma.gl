import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUHistogram

<GPUPrimitivesDocsTabs active="histogram" />

## Overview

`GPUHistogram` counts packed scalar values into a caller-owned `uint32` output view. The output
length defines the bin count.

## Concepts

A histogram partitions a numeric domain into equal-width intervals and counts how many values land
in each interval. The minimum is inclusive, the maximum is included in the final bin, and values
outside the domain are ignored. A literal domain is fixed at graph construction, a GPU domain can
be produced by another node, and `'auto'` inserts an extent reduction.

### Why irregular edges are planned

The current equal-width bins work well for compact numeric domains. They are less useful for
heavy-tailed measurements such as trace durations and request latency, where values may range from
microseconds to seconds. A linear histogram can collapse most observations into one short-duration
bin while leaving much of the long tail almost empty.

Planned irregular edges will let applications preserve useful resolution across orders of
magnitude and align bins with meaningful thresholds. A latency histogram could use boundaries such
as `10 µs`, `100 µs`, `1 ms`, `10 ms`, `100 ms`, `1 s`, and `10 s`. The same bins can then compare
processes, releases, or dynamically filtered subsets while remaining in the original unit and
without first materializing a log-transformed GPU column. Exact service-level or alert boundaries
can also become bin edges instead of falling somewhere inside a uniform interval.

This capability is planned rather than part of the current constructor. Its contract still needs
to define edge ordering and validation, inclusive boundaries, GPU-resident edge updates, and
behavior for values outside the edge range.

The output is a distribution, not a prefix sum. Compose it with inclusive `GPUScan` to obtain a
cumulative distribution, or reduce the bins to validate the accepted-row total.

```ts
new GPUHistogram({input: values, output: counts, domain: 'auto'}).addToGraph(graph);
```

## Constructor

```ts
type GPUHistogramProps<T extends 'uint32' | 'sint32' | 'float32'> = {
  id?: string;
  input: GraphDataView<T> | GraphVectorView<T>;
  output: GraphDataView<'uint32'>;
  domain: readonly [number, number] | GraphDataView<T> | 'auto';
};
```

For a `GraphVectorView`, the histogram preserves the ordered input topology: it does not pack,
concatenate, or rewrite chunks. The output is cleared once, then each non-empty `GraphDataView`
chunk accumulates into the same bins in source order. Empty chunks add no accumulation pass.

`'auto'` inserts one multi-chunk `GPUReduction` extent, so its domain covers every non-empty chunk.
Values outside the domain and non-finite floats are ignored. An exact maximum enters the final bin.
For a degenerate domain, matching values enter bin zero. Counts wrap as `uint32`.

Every encoding clears the output before accumulation, so a compiled graph is safely reusable.
Up to 256 bins use workgroup-local atomics; larger histograms use direct global atomics.
