---
title: Graph
description: Schedule GPU work and compose graph-based algorithms and processing modules.
---

# Graph

`@luma.gl/graph` owns GPU execution graphs and graph-based processing.

```typescript
import {GPUGraph} from '@luma.gl/graph';
import {GPUScan} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
```

The root exposes scheduling, compilation, encoding, inspection, and autotuning. Optional processing modules use explicit subpaths.

| Subpath | Capability |
| --- | --- |
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

GPU data primitives and immediate operations remain in `@luma.gl/gpgpu`. Engine renderers and application adapters consume these graph APIs from their own packages.

See the [execution guide](/docs/api-reference/experimental/gpu-core/concepts), [scheduler reference](/docs/api-reference/experimental/gpu-core/gpu-command-graph), and [migration guide](/docs/upgrade-guide).
