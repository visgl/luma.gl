# luDF: GPU-Resident Dataframes

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[SceneRenderer](https://luma.gl/next/docs/api-reference/experimental/scene-renderer.md)[Deferred Scenes](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md)[PBR Environments](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[GPU Rasters](https://luma.gl/next/docs/api-reference/experimental/luraster.md)[GPU Graphs](https://luma.gl/next/docs/api-reference/experimental/lugraph.md)[luDF](https://luma.gl/next/docs/api-reference/experimental/ludf.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`@luma.gl/experimental/ludf` provides immutable, visualization-oriented dataframe operations on existing WebGPU-resident tables. Filters, derived columns, reductions, histograms, categorical grouping, stable per-batch sorting, and bounded hash joins compile into reusable `GPUCommandGraph` work. Source record batches, null masks, stable row identifiers, and results stay on the GPU until an application explicitly chooses to read them.

luDF is inspired by the GPU-resident dataframe ideas pioneered by [NVIDIA RAPIDS cuDF](https://github.com/rapidsai/cudf). It is an independent browser-native WebGPU implementation, not a CUDA port, a compatible cuDF API, a SQL engine, or a claim of feature parity.

## Attribution and licensing[​](#attribution-and-licensing "Direct link to Attribution and licensing")

We gratefully acknowledge NVIDIA and the RAPIDS contributors for pioneering GPU-resident dataframe analytics. [NVIDIA RAPIDS cuDF](https://github.com/rapidsai/cudf) is distributed under the [Apache License 2.0](https://github.com/rapidsai/cudf/blob/main/LICENSE).

luDF is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE) vis.gl implementation for browser-native WebGPU; it does not copy or translate cuDF source code, including CUDA or Python implementations. It does not claim cuDF API compatibility or feature parity, and is neither affiliated with nor endorsed by NVIDIA.

## Try the interactive example[​](#try-the-interactive-example "Direct link to Try the interactive example")

The [GPU Data Analysis example](https://luma.gl/next/examples/experimental/gpu-data-analysis) uploads real Apache Arrow tables and compares GPU filtering, dense grouping, stable sorting, and unique-right joins against CPU references. Its luDF benchmark is opt-in and separately reports upload, graph compilation, index construction, fenced GPU execution, explicit validation readback, and CPU execution.

## Supported data and package boundaries[​](#supported-data-and-package-boundaries "Direct link to Supported data and package boundaries")

| Capability         | Supported behavior                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| GPU scalar storage | Packed `float32`, `sint32`, and `uint32` columns; Arrow `Int32` maps to `sint32`.                                                   |
| Categories         | Explicit adapter-owned UTF-8 dictionary labels with GPU-resident 32-bit indices. Dense grouping and joins require `uint32` indices. |
| Nullable values    | Separate source-row-aligned `GPUVector<'uint32'>` validity masks. Nullable columns with unknown validity cannot be evaluated.       |
| Source topology    | Every original `GPURecordBatch`, including empty batches, remains independently identifiable.                                       |
| Row identity       | Stable original source-row identifiers, including caller-provided batch offsets.                                                    |
| Execution          | One browser WebGPU device and caller-owned command encoding, submission, and optional readback.                                     |

Import the dataframe facade only from its optional subpath. Arrow-specific upload helpers belong to `@luma.gl/arrow`; generic GPU storage remains in `@luma.gl/tables`. Neither `@luma.gl/tables` nor luDF requires Apache Arrow as a runtime dependency.

```
import {makeGPUAnalyticsTableFromArrowTable} from '@luma.gl/arrow';

import {GPUCommandGraph} from '@luma.gl/experimental';

import {

  LuDataFrame,

  and,

  column,

  literal,

  parameter,

  type LuDataFrameQueryParameters

} from '@luma.gl/experimental/ludf';
```

The root `@luma.gl/experimental` entry point does not export `LuDataFrame`; applications that do not import `/ludf` do not take on the dataframe facade.

## Upload Arrow data or borrow an existing table[​](#upload-arrow-data-or-borrow-an-existing-table "Direct link to Upload Arrow data or borrow an existing table")

`makeGPUAnalyticsTableFromArrowTable` uploads numeric values and dictionary indices into the existing `GPUData`, `GPUVector`, `GPURecordBatch`, and `GPUTable` storage model. It does not require a renderer `ShaderLayout` and preserves sliced Arrow offsets, record-batch boundaries, null counts, and ordered dictionary metadata.

```
import * as arrow from 'apache-arrow';



const arrowTable = arrow.tableFromArrays({

  fare: new Float32Array([12, 24, 36]),

  customerId: new Uint32Array([3, 7, 9])

});



const uploaded = makeGPUAnalyticsTableFromArrowTable(device, arrowTable, {

  columns: ['fare', 'customerId']

});



const dataframe = new LuDataFrame({...uploaded, ownership: 'owned'});



dataframe.schema;

dataframe.columnNames;

dataframe.numRows;

dataframe.batches;

dataframe.sourceInfo;

dataframe.column('fare');

dataframe.validity.fare;

dataframe.dictionaries;

uploaded.nullCounts;
```

Each selected nullable Arrow field receives its own batch-aligned `uint32` validity vector, where `0` means null and `1` means valid. The helper accounts for sliced bitmap offsets; dictionary labels remain explicit CPU metadata rather than pretending arbitrary strings are GPU-native scalars.

Applications with an existing generic GPU table can provide their own masks and dictionaries:

```
const borrowed = new LuDataFrame({

  table: sourceTable,

  validity: {fare: fareValidity},

  dictionaries: {category: {values: ['Local', 'Express'], ordered: false}},

  ownership: 'borrowed'

});



const fares = borrowed.select(['fare']);
```

Projection creates independently borrowed views without calling the destructive `GPUTable.select()` operation. Source batches, backing buffers, and sibling projections remain intact.

## Plan expressions and filters without GPU work[​](#plan-expressions-and-filters-without-gpu-work "Direct link to Plan expressions and filters without GPU work")

Constructing a dataframe, selecting columns, and creating query plans never allocates GPU outputs, encodes commands, or submits work. Expressions are immutable typed trees; column names and scalar parameters never become unchecked WGSL identifiers or source strings.

```
const query = dataframe

  .filter(

    and(

      column('fare').greaterThan(parameter('minimumFare', 10)),

      column('customerId').isValid()

    )

  )

  .select(['fare', 'customerId']);
```

Scalar expressions provide arithmetic, comparisons, `isValid()`, and `isNull()`. Compose predicates with `and`, `or`, and `not`; use `literal(value)` for fixed numeric or boolean values and `parameter(name, initialValue)` for values updated when encoding an already-compiled graph.

Nullable expressions follow SQL-style three-valued logic:

| Expression                       | Result           |
| -------------------------------- | ---------------- |
| `false AND null`                 | `false`          |
| `true AND null`                  | `null`           |
| `true OR null`                   | `true`           |
| `false OR null`                  | `null`           |
| `NOT null`                       | `null`           |
| `isValid(null)` / `isNull(null)` | `false` / `true` |

A filter accepts only a valid `true` predicate. A nonempty nullable source field without an explicit validity sidecar is rejected instead of silently treating its rows as valid.

## Add nullable derived columns[​](#add-nullable-derived-columns "Direct link to Add nullable derived columns")

`withColumn` appends a new logical column, preserves existing query immutability, and propagates the expression's null validity into a separate GPU-backed sidecar when needed:

```
const adjusted = dataframe

  .withColumn('adjustedFare', column('fare').multiply(literal(1.2)), {

    format: 'float32'

  })

  .withColumn('serviceCharge', column('adjustedFare').subtract(column('fare')))

  .filter(column('serviceCharge').greaterThan(literal(1)))

  .select(['customerId', 'adjustedFare', 'serviceCharge']);
```

Later derived expressions may reference earlier derived columns; hidden dependencies remain available even when the final projection excludes them. Formats are inferred from compatible source operands, and an explicit format must match the inferred scalar format. Replacing an existing column, implicit casts, arbitrary string values, and mixed scalar arithmetic are not supported.

## Compile, encode, and retain GPU-resident results[​](#compile-encode-and-retain-gpu-resident-results "Direct link to Compile, encode, and retain GPU-resident results")

Each query compiles into one caller-provided command graph. Encoding updates named parameters without recompiling and records work into an application-owned command encoder:

```
const graph = new GPUCommandGraph<LuDataFrameQueryParameters>(device);

const compiled = query.compile(graph);



const commandEncoder = device.createCommandEncoder({id: 'ludf-interaction'});

compiled.encode(commandEncoder, {minimumFare: 25});

device.submit(commandEncoder.finish());



compiled.table;

compiled.validity;

compiled.dictionaries;

compiled.selectionMask;

compiled.rowIndices;

compiled.selectedCounts;
```

`selectionMask` is source-aligned, `rowIndices` contains stable selected source identifiers, and `selectedCounts` contains one GPU count per original batch. Derived values, reductions, category groups, histograms, and joined row identifiers are also exposed as GPU-backed tables or vectors. No luDF method submits the command encoder or performs implicit CPU readback.

Compile each independent plan into a new `GPUCommandGraph`; a graph becomes immutable once compiled. Re-encode the same compiled query with new parameters for repeated interactions.

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

Cross-batch grouping accumulates contributions from every original source batch without repacking the source table. `CompiledLuDataFrameGroupedAggregation.groupCount` exposes the dense domain.

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

## Sort and select top-K rows per source batch[​](#sort-and-select-top-k-rows-per-source-batch "Direct link to Sort and select top-K rows per source batch")

Numeric ordering is stable for `uint32`, `sint32`, and `float32` keys. Sorting returns GPU-resident stable source-row identifiers rather than rewriting the source table:

```
const sorted = dataframe.sortBy('fare', {

  direction: 'ascending',

  nulls: 'last',

  nans: 'last',

  algorithm: 'auto'

});



const highestPerBatch = dataframe.topK('fare', 10, {

  direction: 'descending',

  nulls: 'last'

});



const lowestPerBatch = dataframe.sortBy('fare').topK(10);
```

`sortBy` defaults to ascending order; direct `topK` defaults to descending order; calling `topK` on an existing sorted plan preserves its established ordering. `nulls` places nulls outside all nonnull values, while `nans` orders NaNs among the remaining nonnull floating-point values. Positive and negative zero compare equally and retain stable source order; infinities are ordinary numeric values. Deselected rows never enter the published selected prefix.

Sorting and top-K are performed independently within every original source batch. There is no implicit global cross-batch materialization. Compiled results expose the original table, sorted `rowIndices`, updated `selectionMask`, and one selected count per preserved batch.

### Explicit global ordering and top-K[​](#explicit-global-ordering-and-top-k "Direct link to Explicit global ordering and top-K")

Use `sortByGlobal` or `topKGlobal` when ordering must span every source batch. These operations explicitly stage numeric sort keys and source identities into GPU scratch; they never concatenate, copy, or reorder the original dataframe columns:

```
const globallySorted = dataframe.sortByGlobal('fare', {

  direction: 'ascending',

  nulls: 'last',

  nans: 'last'

});



const highestOverall = dataframe.topKGlobal('fare', 10);

const lowestOverall = dataframe.sortByGlobal('fare').topK(10);



const compiled = highestOverall.compile(

  new GPUCommandGraph<LuDataFrameQueryParameters>(device)

);



compiled.globalRowIndices;

compiled.globalSelectedCount;

compiled.selectionMask;

compiled.selectedCounts;
```

`globalRowIndices` contains one globally stable source-row permutation, including discontinuous adapter-provided source offsets. `globalSelectedCount` is one GPU-owned scalar describing its valid prefix. Equal keys retain their original cross-batch source order; null placement, NaN placement, signed zeros, infinities, filtered rows, and derived values follow the same rules as per-batch sorting. A global top-K limit is applied once across all batches; the original batch-aligned selection masks and counts are updated to match that same global result.

### Scaling beyond one-dimensional workgroup limits[​](#scaling-beyond-one-dimensional-workgroup-limits "Direct link to Scaling beyond one-dimensional workgroup limits")

WebGPU limits the number of workgroups in each individual dispatch dimension, but that does not limit a dataframe batch to one dimension. luDF maps linear source rows and dense result rows across bounded three-dimensional workgroup layouts while preserving their original row order and batch boundaries. Filtering, derived expressions, visibility compaction, grouped statistics, scalar reductions, histograms, stable sorting, and join preparation all use the same overflow-safe linear indexing scheme.

For example, an adapter limited to two workgroups per dimension can still process 1,025 rows with 256-thread workgroups by dispatching a `2 × 2 × 2` grid. The shader converts each workgroup's three-dimensional coordinate back into its original linear row index and ignores padded lanes. Dense histogram bins and categorical group outputs are initialized and finalized the same way.

Actual dataset capacity remains constrained by unsigned 32-bit row indices, the full three-dimensional workgroup capacity, and adapter storage-buffer size limits. Dispatch scaling does not concatenate batches, make per-batch sorting global, or transfer GPU-resident rows back to the CPU.

## Join or look up unique right-side keys[​](#join-or-look-up-unique-right-side-keys "Direct link to Join or look up unique right-side keys")

luDF supports bounded, unique-right-key `uint32` inner, left outer, semi, and anti joins, together with source-aligned lookups. Left and right tables may have different batch topologies, empty chunks, nullable keys, and explicit original source-row offsets. The right-side hash index is built directly from its original batches; neither side is concatenated or repacked.

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

  .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device));



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

  .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device));



const matchedCustomers = customers

  .semiJoin(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device));



const unmatchedCustomers = customers

  .antiJoin(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device));



const lookups = customers

  .lookup(accounts, {leftOn: 'customerId', rightOn: 'accountId'})

  .compile(new GPUCommandGraph<LuDataFrameQueryParameters>(device));



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

## Share GPU outputs with rendering and LuxFilter[​](#share-gpu-outputs-with-rendering-and-luxfilter "Direct link to Share GPU outputs with rendering and LuxFilter")

Visualization shaders can consume `compiled.selectionMask`, `compiled.rowIndices`, aggregated GPU columns, and joined source-row identifiers directly as storage or vertex buffers. Import the same existing table vectors into a separate [`LuxFilter`](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md) graph when an application needs linked ranges, brushes, histograms, or visibility views:

```
const interactionGraph = new GPUCommandGraph(device);

const fare = interactionGraph.importGPUVector('fare', dataframe.table.gpuVectors.fare);

const category = interactionGraph.importGPUVector('category', dataframe.table.gpuVectors.category);



const fareValidity = dataframe.validity.fare

  ? interactionGraph.importGPUVector('fare-validity', dataframe.validity.fare)

  : undefined;
```

LuxFilter and other lower-level consumers do not automatically interpret luDF's nullable sidecars; combine the explicit validity mask into their selection before treating nullable values as valid. Sharing vectors does not transfer ownership, merge source batches, or require CPU row readback.

## Measure GPU work without hiding synchronization[​](#measure-gpu-work-without-hiding-synchronization "Direct link to Measure GPU work without hiding synchronization")

The opt-in [GPU Data Analysis benchmark](https://luma.gl/next/examples/experimental/gpu-data-analysis) reports separate durations for:

1. Uploading Arrow columns, explicit validity masks, and dictionaries.
2. Compiling caller-owned luDF command graphs.
3. Building a standalone right-side hash index equivalent to the join's index.
4. Encoding and executing GPU filtering, grouping, sorting, and joining.
5. Explicitly reading only the outputs required for validation.
6. Computing the corresponding CPU reference results.

Choose a source size between **1,024 and 1,048,576 rows** and one, three, or five measured samples. Fixtures use packed typed arrays and genuine sliced nullable Arrow dictionary batches rather than allocating one JavaScript object per row. Every workload performs an excluded warmup before the measured samples; the reported filter, grouping, stable top-K, and join comparisons use median CPU and completion-fenced GPU durations, observed GPU rows per second, and measured speedup.

The example records an overall GPU crossover only when a size actually measured on the current device has lower aggregate execution time than the equivalent CPU workloads. Upload, compilation, explicit validation readback, and the separately measured index are intentionally not hidden inside that execution-only comparison. Browser devices, available memory, and adapter limits still determine which selected sizes can complete.

GPU durations wait for `device.createFence().signaled` rather than measuring command submission alone. The separately reported index-build phase is an equivalent standalone measurement; the complete join execution still includes construction of its own index. Timings must not be added or subtracted as if those duplicated builds were one disjoint operation.

Validation compares GPU results with CPU references for filtering, grouped aggregation, stable sorting, and unique-right joins. This benchmark's bounded result readback is explicit and optional; ordinary luDF query execution never reads source rows or results back implicitly.

## Ownership, fallback, and intentional limits[​](#ownership-fallback-and-intentional-limits "Direct link to Ownership, fallback, and intentional limits")

`ownership: 'borrowed'` is the default: destroying a dataframe or its projections does not destroy the caller's original table or validity vectors. With `ownership: 'owned'`, the original table and provided validity sidecars are released only after every borrowed projection and compiled query has released its shared source lease:

```
const owner = new LuDataFrame({...uploaded, ownership: 'owned'});

const retained = owner.filter(column('fare').isValid()).compile(

  new GPUCommandGraph<LuDataFrameQueryParameters>(device)

);



owner.destroy();

retained.destroy();
```

Always call `destroy()` on compiled queries and owned frames when they are no longer needed; calls are idempotent. Applications without an available WebGPU adapter must offer their own CPU path or display an unsupported-device state. luDF does not transparently switch execution backends.

Native GPU `float64` and `int64`, arbitrary GPU strings, distributed or multi-GPU execution, full SQL semantics, and complete cuDF compatibility are outside the supported scope. See [GPU Primitives and Command Graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md) for the underlying WebGPU execution infrastructure.
