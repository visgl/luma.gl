import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUExampleCard} from '@site/src/components/docs/gpu-example-card';
import {GPUDataAnalysisExample} from '@site/src/examples';

# GPU Dataframe

<ExperimentalDocsTabs active="gpu-dataframe" />

## Overview

`@luma.gl/experimental/gpu-dataframe` compiles dataframe-style expressions, filters, aggregations, ordering,
and joins into a caller-owned `GPUCommandGraph`. It consumes Arrow-independent `GPUTable` and
`GPUVector` storage while preserving source chunks and GPU-resident outputs.

## When to use it

Use GPU Dataframe when columnar data is already on the GPU or when its results will feed GPU rendering or
additional analysis. It is designed for explicit, repeatable plans rather than ad hoc CPU queries or
implicit downloads.

## Quick start

```ts
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUDataFrame} from '@luma.gl/experimental/gpu-dataframe';

const graph = new GPUCommandGraph({device, id: 'dataframe-analysis'});
const frame = new GPUDataFrame({device, graph, table});
const filtered = frame.filter({column: 'duration', greaterThan: 10});

filtered.groupBy('service').mean('duration');
const compiledGraph = graph.compile();
```

## Core concepts and data model

- A dataframe borrows or owns explicit GPU table storage.
- Expressions describe work without encoding or submitting it.
- Compilation fixes formats, chunk topology, capacities, and execution shape.
- Filters and derived columns remain GPU-resident and can be shared with renderers or GPU Crossfilter.
- Global ordering and bounded joins require explicit policies rather than hidden repacking.

## Try the interactive example

<GPUExampleCard
  demonstrates={['derived columns', 'filtering', 'grouped aggregation', 'sorting']}
  input="Chunked Arrow-independent GPU table columns"
  gpuOutput="Masks, derived columns, grouped summaries, and ordered row IDs"
  cpuReadback="Bounded table and chart results only"
  execution="Compiled queries re-encode against changed controls"
  compatibility="WebGPU"
  fullPageHref="/examples/experimental/gpu-data-analysis"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-data-analysis"
  inspectorHref="/examples/experimental/gpu-data-analysis?panel=graph"
/>

<GPUDataAnalysisExample embedded />

## Operations and API index

| Family | Operations |
| --- | --- |
| Data and expressions | `GPUDataFrame`, `GPUDataFrameQuery`, `GPUExpression`, `CompiledGPUDataFrameQuery`, filters, nullable derived columns |
| Aggregation | `GPUDataFrameGroupByQuery`, `GPUDataFrameGroupedAggregationQuery`, `GPUDataFrameAggregationQuery`, `GPUDataFrameHistogramQuery`, `CompiledGPUDataFrameGroupedAggregation`, `CompiledGPUDataFrameAggregation`, `CompiledGPUDataFrameHistogram` |
| Ordering | `GPUDataFrameSortQuery`, `GPUDataFrameGlobalSortQuery`, `CompiledGPUDataFrameSort`, `CompiledGPUDataFrameGlobalSort` |
| Indexes and joins | `GPUDataFrameLookupQuery`, `GPUDataFrameJoinQuery`, `CompiledGPUDataFrameLookup`, `CompiledGPUDataFrameJoin` |
| Integration | retained outputs for rendering, GPU Crossfilter, telemetry, and bounded readback |

See the [operations reference](./gpu-dataframe-operations) for detailed execution and ownership contracts.

## Limits and compatibility

- GPU Dataframe is experimental and WebGPU-only.
- Source batch boundaries are preserved unless global behavior is requested explicitly.
- Join uniqueness, output capacity, null behavior, and overflow are explicit contracts.
- Submission, synchronization, readback, and fallback remain application-owned.

## Related modules

- GPU scheduling supplies scheduling and primitives.
- [GPU Crossfilter](./gpu-crossfilter) composes linked interactive selections.
- [`@luma.gl/gpgpu/gpu-data`](/docs/api-reference/gpgpu/gpu-data) defines primitive GPU storage,
  while [`@luma.gl/experimental/gpu-tables`](/docs/api-reference/experimental/gpu-tables) defines
  record batches and tables.
