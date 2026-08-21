# GPU Dataframe

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md)[Expressions](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-expressions.md)[Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-aggregation.md)[Sorting](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-sorting.md)[Indexes & Joins](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-indexes-joins.md)[SQL](https://luma.gl/docs/api-reference/experimental/gpu-sql.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/experimental/gpu-dataframe` compiles dataframe-style expressions, filters, aggregations, ordering, and joins into a caller-owned `GPUCommandGraph`. It consumes Arrow-independent `GPUTable` and `GPUVector` storage while preserving source chunks and GPU-resident outputs.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU Dataframe when columnar data is already on the GPU or when its results will feed GPU rendering or additional analysis. It is designed for explicit, repeatable plans rather than ad hoc CPU queries or implicit downloads.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

import {GPUDataFrame} from '@luma.gl/experimental/gpu-dataframe';



const graph = new GPUCommandGraph({device, id: 'dataframe-analysis'});

const frame = new GPUDataFrame({device, graph, table});

const filtered = frame.filter({column: 'duration', greaterThan: 10});



filtered.groupBy('service').mean('duration');

const compiledGraph = graph.compile();
```

## Core concepts and data model[​](#core-concepts-and-data-model "Direct link to Core concepts and data model")

* A dataframe borrows or owns explicit GPU table storage.
* Expressions describe work without encoding or submitting it.
* Compilation fixes formats, chunk topology, capacities, and execution shape.
* Filters and derived columns remain GPU-resident and can be shared with renderers or GPU Crossfilter.
* Global ordering and bounded joins require explicit policies rather than hidden repacking.

## Try the interactive example[​](#try-the-interactive-example "Direct link to Try the interactive example")

* Demonstrates

  derived columns · filtering · grouped aggregation · sorting

* Input

  Chunked Arrow-independent GPU table columns

* GPU output

  Masks, derived columns, grouped summaries, and ordered row IDs

* CPU readback

  Bounded table and chart results only

* Execution

  Compiled queries re-encode against changed controls

* Compatibility

  WebGPU

[Open full page](https://luma.gl/examples/experimental/gpu-data-analysis)[View source](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-data-analysis)[Inspect graph](https://luma.gl/examples/experimental/gpu-data-analysis?panel=graph)

Scroll page · Ctrl/⌘ + scroll to interact

## Operations and API index[​](#operations-and-api-index "Direct link to Operations and API index")

| Family               | Operations                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data and expressions | `GPUDataFrame`, `GPUDataFrameQuery`, `GPUExpression`, `CompiledGPUDataFrameQuery`, filters, nullable derived columns                                                                                                                          |
| Aggregation          | `GPUDataFrameGroupByQuery`, `GPUDataFrameGroupedAggregationQuery`, `GPUDataFrameAggregationQuery`, `GPUDataFrameHistogramQuery`, `CompiledGPUDataFrameGroupedAggregation`, `CompiledGPUDataFrameAggregation`, `CompiledGPUDataFrameHistogram` |
| Ordering             | `GPUDataFrameSortQuery`, `GPUDataFrameGlobalSortQuery`, `CompiledGPUDataFrameSort`, `CompiledGPUDataFrameGlobalSort`                                                                                                                          |
| Indexes and joins    | `GPUDataFrameLookupQuery`, `GPUDataFrameJoinQuery`, `CompiledGPUDataFrameLookup`, `CompiledGPUDataFrameJoin`                                                                                                                                  |
| Integration          | retained outputs for rendering, GPU Crossfilter, telemetry, and bounded readback                                                                                                                                                              |

See the [operations reference](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md) for detailed execution and ownership contracts.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* GPU Dataframe is experimental and WebGPU-only.
* Source batch boundaries are preserved unless global behavior is requested explicitly.
* Join uniqueness, output capacity, null behavior, and overflow are explicit contracts.
* Submission, synchronization, readback, and fallback remain application-owned.

## Related modules[​](#related-modules "Direct link to Related modules")

* [GPU Core](https://luma.gl/docs/api-reference/experimental/gpu-core.md) supplies scheduling and primitives.
* [GPU Crossfilter](https://luma.gl/docs/api-reference/experimental/gpu-crossfilter.md) composes linked interactive selections.
* [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/docs/api-reference/gpgpu/gpu-data.md) defines primitive GPU storage, while [`@luma.gl/experimental/gpu-tables`](https://luma.gl/docs/api-reference/experimental/gpu-tables.md) defines record batches and tables.
