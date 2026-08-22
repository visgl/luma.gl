# GPU Dataframe grouping and aggregation

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-operations.md)[Expressions](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-expressions.md)[Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-aggregation.md)[Sorting](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-sorting.md)[Indexes & Joins](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-indexes-joins.md)[SQL](https://luma.gl/next/docs/api-reference/experimental/gpu-sql.md)

## Group dense categorical values[​](#group-dense-categorical-values "Direct link to Group dense categorical values")

Group keys must use `uint32` GPU storage. Dictionary-backed keys infer their dense group count from the adapter-owned labels; raw `uint32` keys require an explicit `groupCount`. The following example assumes the dataframe also contains a dictionary-backed `category` column.

```
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

Grouping preserves the category dictionary and publishes one row for every dense group, including empty groups. Nullable keys are excluded. Count results are `uint32`; summed, minimum, maximum, and mean values currently require `float32` input. Null, NaN, and infinite metric values do not contribute. Empty numeric groups have an explicit invalid output mask; their sum payload is zero and minimum, maximum, and mean payloads are NaN.

Cross-batch grouping accumulates contributions from every original source batch without repacking the source table. `CompiledGPUDataFrameGroupedAggregation.groupCount` exposes the dense domain.

## Compute global reductions and explicit histograms[​](#compute-global-reductions-and-explicit-histograms "Direct link to Compute global reductions and explicit histograms")

Global reductions support packed `float32`, `sint32`, and `uint32` metric columns:

```
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

`count` counts selected source rows and produces `uint32`. A metric's sum, minimum, and maximum retain its input format; its mean is `float32`. Metric nulls and nonfinite floating-point values are excluded independently, and each potentially empty metric has an explicit one-row validity mask. Native integer sums wrap to their 32-bit representation, floating-point reductions retain `float32` precision, and oversized row counts are rejected instead of silently overflowing.

Histograms publish a dense GPU table of `uint32` `bin` identifiers and `count` values. Supply either an explicit equal-width domain or 2–257 strictly ascending literal edges; automatic domains are not supported because masked or nullable source values must not influence an inferred extent. Existing filters, null masks, derived columns, and repeated query parameters apply before binning.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU Dataframe overview](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe.md)
* [GPU Dataframe operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe-operations.md)
* [GPU tables](https://luma.gl/next/docs/api-reference/experimental/gpu-tables.md)
