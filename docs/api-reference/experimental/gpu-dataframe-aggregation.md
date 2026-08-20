---
title: GPU Dataframe grouping and aggregation
description: Group categorical values and compute reductions and histograms on GPU-resident tables.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU Dataframe grouping and aggregation

<ExperimentalDocsTabs active="gpu-dataframe-aggregation" />

## Group dense categorical values

Group keys must use `uint32` GPU storage. Dictionary-backed keys infer their dense group count from
the adapter-owned labels; raw `uint32` keys require an explicit `groupCount`. The following example
assumes the dataframe also contains a dictionary-backed `category` column.

```ts
const grouped = dataframe
  .filter(column('fare').greaterThan(parameter('minimumFare', 10)))
  .groupBy('category')
  .aggregate({
    rides: 'count',
    totalFare: {sum: 'fare'},
    minimumFare: {min: 'fare'},
    maximumFare: {max: 'fare'},
    averageFare: {mean: 'fare'}
  });

const explicitGroups = dataframe.groupBy('category', {groupCount: 4});
```

Grouping preserves the category dictionary and publishes one row for every dense group, including
empty groups. Nullable keys are excluded. Count results are `uint32`; summed, minimum, maximum,
and mean values currently require `float32` input. Null, NaN, and infinite metric values do not
contribute. Empty numeric groups have an explicit invalid output mask; their sum payload is zero
and minimum, maximum, and mean payloads are NaN.

Cross-batch grouping accumulates contributions from every original source batch without repacking
the source table. `CompiledGPUDataFrameGroupedAggregation.groupCount` exposes the dense domain.

## Compute global reductions and explicit histograms

Global reductions support packed `float32`, `sint32`, and `uint32` metric columns:

```ts
const totals = dataframe.aggregate({
  rows: 'count',
  totalFare: {sum: 'fare'},
  minimumFare: {min: 'fare'},
  maximumFare: {max: 'fare'},
  averageFare: {mean: 'fare'}
});

const equalWidth = dataframe.histogram('fare', {
  bins: 8,
  domain: [0, 80]
});

const customEdges = dataframe.histogram('fare', {
  edges: [0, 10, 25, 50, 100]
});
```

`count` counts selected source rows and produces `uint32`. A metric's sum, minimum, and maximum
retain its input format; its mean is `float32`. Metric nulls and nonfinite floating-point values
are excluded independently, and each potentially empty metric has an explicit one-row validity
mask. Native integer sums wrap to their 32-bit representation, floating-point reductions retain
`float32` precision, and oversized row counts are rejected instead of silently overflowing.

Histograms publish a dense GPU table of `uint32` `bin` identifiers and `count` values. Supply either
an explicit equal-width domain or 2–257 strictly ascending literal edges; automatic domains are not
supported because masked or nullable source values must not influence an inferred extent. Existing
filters, null masks, derived columns, and repeated query parameters apply before binning.

## Related pages

- [GPU Dataframe overview](/docs/api-reference/experimental/gpu-dataframe)
- [GPU Dataframe operations index](/docs/api-reference/experimental/gpu-dataframe-operations)
- [GPU tables](/docs/api-reference/tables)
