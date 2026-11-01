---
title: Graph
description: Schedule GPU work and compose graph-based algorithms and processing modules.
---

# Graph

`@luma.gl/graph` owns GPU execution graphs and graph-based processing.

```typescript
import {GPUGraph, GPUGraphCompiler, GPUCommandGraph} from '@luma.gl/graph';
import {GPUScan} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
```

The root exposes scheduling, compilation, encoding, inspection, and autotuning. Optional processing modules use explicit subpaths.

| Subpath | Capability |
| --- | --- |
| [`gpu-simple-graph`](/docs/api-reference/graph/gpu-simple-graph) | Portable evaluator-backed composition, upload/copy, scoped runs, and output storage |
| `gpu-core` | Graph primitives, GPU programs, resource planning, and execution helpers |
| `gpu-graph-algorithms` | Graph topology, analytics, and layouts |
| `gpu-parse` | Encoded columnar page decoding |
| `gpu-vector-search` | Similarity search and clustering |
| `gpu-dggs`, `gpu-h3`, `gpu-a5`, `geospatial`, `gpu-project` | Spatial indexing and coordinate processing |
| `gpu-physics`, `gpu-geometry`, `gpu-pointcloud`, `gpu-timeseries` | Physics and domain computations |
| `gpu-tables`, `gpu-dataframe`, `gpu-sql`, `gpu-crossfilter` | Tables, queries, and selection |
| `gpu-raster`, `lucim` | Raster and volume processing |
| `gpu-simulation`, `gpu-effects` | Graph-based ocean/fire simulations and FFT bloom |
| `gpu-trace` | Trace analytics |

GPU data primitives live in `@luma.gl/graph/gpu-data`; evaluator expressions and immediate operations live in `@luma.gl/graph/gpu-simple-graph`. Engine renderers and application adapters consume these graph APIs from their own packages.

See the [execution guide](/docs/api-reference/experimental/gpu-core/concepts), [scheduler reference](/docs/api-reference/experimental/gpu-core/gpu-command-graph), and [migration guide](/docs/upgrade-guide).

## Buffer and texture management

See [Buffers and textures](/docs/api-reference/experimental/gpu-core/resources) for logical values,
views, imported and transient ownership, hazard tracking, history, resizing, and encoding contracts.

`GPUGraph` describes application operations and logical values. `GPUGraphCompiler`
lowers those operations to a `GPUCommandGraph`, which schedules concrete GPU passes
and resources. `CompiledGPUCommandGraph` encodes the resulting commands. The existing
compiler remains WebGPU-only; `GPUSimpleGraph` is the separate portable evaluator API.

## Reusable expressions

[`GPUExpressionOperation`](./gpu-expression-operation.md) supplies the same named arithmetic
expression operation to `GPUGraph` and `GPUSimpleGraph`. Declare scalars and vectors, compile
without input data, then bind GPUVectors and scalar values on each run.
