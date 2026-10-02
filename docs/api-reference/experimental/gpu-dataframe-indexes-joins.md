# GPU Dataframe indexes and joins

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md)[Expressions](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-expressions.md)[Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-aggregation.md)[Sorting](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-sorting.md)[Indexes & Joins](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-indexes-joins.md)[SQL](https://luma.gl/docs/api-reference/experimental/gpu-sql.md)

## Join or look up unique right-side keys[​](#join-or-look-up-unique-right-side-keys "Direct link to Join or look up unique right-side keys")

GPU Dataframe supports bounded, unique-right-key `uint32` inner, left outer, semi, and anti joins, together with source-aligned lookups. Left and right tables may have different batch topologies, empty chunks, nullable keys, and explicit original source-row offsets. The right-side hash index is built directly from its original batches; neither side is concatenated or repacked.

```
const joined = customers

  .filter(column('customerId').isValid())

  .innerJoin(accounts, {

    leftOn: 'customerId',

    rightOn: 'accountId',

    capacity: 1024,

    indexCapacity: 4096,

    maxProbeCount: 64

  })

  .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));



joined.rowIndices;

joined.rightRowIndices;

joined.rightValidity;

joined.joinType;

joined.requiredCounts;

joined.selectedCounts;

joined.overflows;

joined.indexStatistics;

joined.lookupStatistics;

joined.contractViolation;

joined.rightTable;



const leftOuter = customers

  .leftJoin(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));



const matchedCustomers = customers

  .semiJoin(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));



const unmatchedCustomers = customers

  .antiJoin(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));



const lookups = customers

  .lookup(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<GPUDataFrameQueryParameters>(device));



lookups.rowIndices;

lookups.rightRowIndices;

lookups.matchMask;

lookups.probeCounts;

lookups.indexStatistics;

lookups.contractViolation;
```

For every join, `rowIndices` and `rightRowIndices` contain paired stable source identifiers; `selectedCounts` gives the published prefix while `requiredCounts` reports all selected result rows before capacity truncation. `overflows` flags insufficient output capacity per original left batch. `rightValidity` is a compacted, GPU-resident `uint32` sidecar: `1` means a right partner exists; `0` means the published left row is unmatched and its right identifier is the reserved `0xffffffff` marker.

* `innerJoin` publishes only matching left rows and their right partners.
* `leftJoin` publishes every selected left row, including missing and nullable left keys, and explicitly marks unmatched right partners through `rightValidity`.
* `semiJoin` publishes only selected left rows with an existing right partner.
* `antiJoin` publishes only selected unmatched left rows, including nullable left keys; every published `rightValidity` entry is zero.
* `lookup` preserves source-aligned right identifiers and exposes a match flag and probe count for every left row without compacting the original batches.

All four join modes support the same `capacity`, `indexCapacity`, and `maxProbeCount` options and compose with filtered, projected, or derived left plans. Publication remains stable within each original left batch; no implicit global row ordering or source-column materialization occurs.

The six GPU-resident index statistic words are, in order, unique entries, duplicate keys, index overflow, invalid keys, total probe count, and maximum probe count. A valid key equal to `0xffffffff` is reserved and therefore invalid; nullable right rows are ignored. Duplicate right keys, reserved valid keys, or incomplete hash-index construction set `contractViolation` and suppress all published rows in every join mode instead of returning ambiguous results or treating an incomplete index as missing matches. Dictionary-encoded keys must have identical labels and ordering on both sides.

Many-to-many joins, right/full outer joins, multi-key joins, string-key hashing, and CPU-side result materialization remain intentionally unsupported.

## Share GPU outputs with rendering and GPUCrossfilter[​](#share-gpu-outputs-with-rendering-and-gpucrossfilter "Direct link to Share GPU outputs with rendering and GPUCrossfilter")

Visualization shaders can consume `compiled.selectionMask`, `compiled.rowIndices`, aggregated GPU columns, and joined source-row identifiers directly as storage or vertex buffers. Import the same existing table vectors into a separate [`GPUCrossfilter`](https://luma.gl/docs/api-reference/experimental/gpu-crossfilter.md) graph when an application needs linked ranges, brushes, histograms, or visibility views:

```
const interactionGraph = new GPUCommandGraph(device);

const fare = interactionGraph.importGPUVector('fare', dataframe.table.gpuVectors.fare);

const category = interactionGraph.importGPUVector('category', dataframe.table.gpuVectors.category);



const fareValidity = dataframe.validity.fare

  ? interactionGraph.importGPUVector('fare-validity', dataframe.validity.fare)

  : undefined;
```

GPUCrossfilter and other lower-level consumers do not automatically interpret GPU Dataframe's nullable sidecars; combine the explicit validity mask into their selection before treating nullable values as valid. Sharing vectors does not transfer ownership, merge source batches, or require CPU row readback.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU Dataframe overview](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)
* [GPU Dataframe operations index](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md)
* [GPU tables](https://luma.gl/docs/api-reference/experimental/gpu-tables.md)
