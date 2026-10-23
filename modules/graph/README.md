# @luma.gl/graph

GPU execution graphs and graph-based processing for luma.gl.

```typescript
import {GPUGraph} from '@luma.gl/graph';
import {GPUScan} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
```

The root exposes execution graph scheduling, compilation, encoding, inspection, and autotuning. Domain APIs use explicit subpaths:

- `gpu-core`
- `shader-pipeline`
- `gpu-graph-algorithms`
- `gpu-parse`
- `gpu-vector-search`
- `gpu-dggs`
- `gpu-h3`
- `gpu-a5`
- `gpu-physics`
- `gpu-geometry`
- `gpu-pointcloud`
- `gpu-timeseries`
- `gpu-tables`
- `gpu-dataframe`
- `gpu-sql`
- `gpu-crossfilter`
- `gpu-trace`
- `gpu-project`
- `gpu-raster`
- `geospatial`
- `gpu-simulation`
- `gpu-effects`
- `lucim`

GPU data primitives and immediate operations remain in `@luma.gl/gpgpu`. Graph algorithms use the separate `gpu-graph-algorithms` subpath.
