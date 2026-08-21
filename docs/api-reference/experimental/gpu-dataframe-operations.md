---
title: GPU Dataframe operations
description: Index of GPU Dataframe expression, filtering, grouping, aggregation, sorting, top-K, index, and join operations.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU Dataframe operations reference

<ExperimentalDocsTabs active="gpu-dataframe-operations" />

## Overview

`@luma.gl/experimental/gpu-dataframe` provides immutable, visualization-oriented dataframe operations on
existing WebGPU-resident tables. Filters, derived columns, reductions, histograms, categorical
grouping, stable per-batch sorting, and bounded hash joins compile into reusable
`GPUCommandGraph` work. Source record batches, null masks, stable row identifiers, and results stay
on the GPU until an application explicitly chooses to read them.

GPU Dataframe is inspired by the GPU-resident dataframe ideas pioneered by
[NVIDIA RAPIDS cuDF](https://github.com/rapidsai/cudf). It is an independent browser-native WebGPU
implementation, not a CUDA port, a compatible cuDF API, a SQL engine, or a claim of feature parity.

## Attribution and licensing

We gratefully acknowledge NVIDIA and the RAPIDS contributors for pioneering GPU-resident dataframe
analytics. [NVIDIA RAPIDS cuDF](https://github.com/rapidsai/cudf) is distributed under the
[Apache License 2.0](https://github.com/rapidsai/cudf/blob/main/LICENSE).

GPU Dataframe is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation for browser-native WebGPU; it does not copy or translate cuDF source code,
including CUDA or Python implementations. It does not claim cuDF API compatibility or feature
parity, and is neither affiliated with nor endorsed by NVIDIA.

## Try the interactive example

The [GPU Data Analysis example](/examples/experimental/gpu-data-analysis) uploads real Apache Arrow
tables and compares GPU filtering, dense grouping, stable sorting, and unique-right joins against
CPU references. Its GPU Dataframe benchmark is opt-in and separately reports upload, graph compilation,
index construction, fenced GPU execution, explicit validation readback, and CPU execution.

## Supported data and package boundaries

| Capability | Supported behavior |
| --- | --- |
| GPU scalar storage | Packed `float32`, `sint32`, and `uint32` columns. |
| Categories | Explicit adapter-owned UTF-8 dictionary labels with GPU-resident 32-bit indices. Dense grouping and joins require `uint32` indices. |
| Nullable values | Separate source-row-aligned `GPUVector<'uint32'>` validity masks. Nullable columns with unknown validity cannot be evaluated. |
| Source topology | Every original `GPURecordBatch`, including empty batches, remains independently identifiable. |
| Row identity | Stable original source-row identifiers, including caller-provided batch offsets. |
| Execution | One browser WebGPU device and caller-owned command encoding, submission, and optional readback. |

Import the dataframe facade only from its optional subpath. Generic GPU storage remains in
`@luma.gl/gpgpu/gpu-data`, while record batches and tables come from
`@luma.gl/experimental/gpu-tables`.

```ts
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUDataFrame,
  and,
  column,
  literal,
  parameter,
  type GPUDataFrameQueryParameters
} from '@luma.gl/experimental/gpu-dataframe';
```

The root `@luma.gl/experimental` entry point does not export `GPUDataFrame`; applications that do
not import `/gpu-dataframe` do not take on the dataframe facade.

## Borrow an existing table

Applications with an existing generic GPU table can provide their own masks and dictionaries:

```ts
const borrowed = new GPUDataFrame({
  table: sourceTable,
  validity: {fare: fareValidity},
  dictionaries: {category: {values: ['Local', 'Express'], ordered: false}},
  ownership: 'borrowed'
});

const fares = borrowed.select(['fare']);
```

Projection creates independently borrowed views without calling the destructive
`GPUTable.select()` operation. Source batches, backing buffers, and sibling projections remain
intact.

## Operation families

| Family | Use it for |
| --- | --- |
| [Expressions and filtering](/docs/api-reference/experimental/gpu-dataframe-expressions) | Immutable predicates, nullable derived columns, and retained results. |
| [Grouping and aggregation](/docs/api-reference/experimental/gpu-dataframe-aggregation) | Dense categorical groups, reductions, and histograms. |
| [Sorting and top-K](/docs/api-reference/experimental/gpu-dataframe-sorting) | Stable per-batch ordering, global ordering, and bounded selection. |
| [Indexes and joins](/docs/api-reference/experimental/gpu-dataframe-indexes-joins) | Unique-key lookup and sharing outputs with rendering or filters. |

## Measure GPU work without hiding synchronization

The opt-in [GPU Data Analysis benchmark](/examples/experimental/gpu-data-analysis) reports separate
durations for:

1. Uploading source columns, explicit validity masks, and dictionaries.
2. Compiling caller-owned GPU Dataframe command graphs.
3. Building a standalone right-side hash index equivalent to the join's index.
4. Encoding and executing GPU filtering, grouping, sorting, and joining.
5. Explicitly reading only the outputs required for validation.
6. Computing the corresponding CPU reference results.

Choose a source size between **1,024 and 1,048,576 rows** and one, three, or five measured samples.
Fixtures use packed typed arrays and genuine sliced nullable dictionary batches rather than
allocating one JavaScript object per row. Every workload performs an excluded warmup before the
measured samples; the reported filter, grouping, stable top-K, and join comparisons use median
CPU and completion-fenced GPU durations, observed GPU rows per second, and measured speedup.

The example records an overall GPU crossover only when a size actually measured on the current
device has lower aggregate execution time than the equivalent CPU workloads. Upload, compilation,
explicit validation readback, and the separately measured index are intentionally not hidden inside
that execution-only comparison. Browser devices, available memory, and adapter limits still
determine which selected sizes can complete.

GPU durations wait for `device.createFence().signaled` rather than measuring command submission
alone. The separately reported index-build phase is an equivalent standalone measurement; the
complete join execution still includes construction of its own index. Timings must not be added or
subtracted as if those duplicated builds were one disjoint operation.

Validation compares GPU results with CPU references for filtering, grouped aggregation, stable
sorting, and unique-right joins. This benchmark's bounded result readback is explicit and optional;
ordinary GPU Dataframe query execution never reads source rows or results back implicitly.

## Ownership, fallback, and intentional limits

`ownership: 'borrowed'` is the default: destroying a dataframe or its projections does not destroy
the caller's original table or validity vectors. With `ownership: 'owned'`, the original table and
provided validity sidecars are released only after every borrowed projection and compiled query
has released its shared source lease:

```ts
const owner = new GPUDataFrame({...uploaded, ownership: 'owned'});
const retained = owner.filter(column('fare').isValid()).compile(
  new GPUCommandGraph<GPUDataFrameQueryParameters>(device)
);

owner.destroy();
retained.destroy();
```

Always call `destroy()` on compiled queries and owned frames when they are no longer needed; calls
are idempotent. Applications without an available WebGPU adapter must offer their own CPU path or
display an unsupported-device state. GPU Dataframe does not transparently switch execution backends.

Native GPU `float64` and `int64`, arbitrary GPU strings, distributed or multi-GPU execution, full SQL
semantics, and complete cuDF compatibility are outside the supported scope. See
GPU Primitives and Command Graphs for
the underlying WebGPU execution infrastructure.

## Related pages

- [GPU Dataframe overview](/docs/api-reference/experimental/gpu-dataframe)
- [GPU tables](/docs/api-reference/experimental/gpu-tables)
- [GPU data analysis example](/examples/experimental/gpu-data-analysis)
