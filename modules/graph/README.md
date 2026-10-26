# @luma.gl/graph

GPU execution graphs and graph-based processing for luma.gl.

```typescript
import {GPUGraph, GPUGraphCompiler, GPUCommandGraph} from '@luma.gl/graph';
import {GPUScan} from '@luma.gl/graph/gpu-core';
import {GPUDataFrame} from '@luma.gl/graph/gpu-dataframe';
```

The root exposes execution graph scheduling, compilation, encoding, inspection, and autotuning. Domain APIs use explicit subpaths:

- `gpu-core`
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

`GPUGraph` describes application operations and logical values. `GPUGraphCompiler`
lowers those operations to a `GPUCommandGraph`, which schedules concrete GPU passes
and resources. `CompiledGPUCommandGraph` encodes the resulting commands. The existing
compiler remains WebGPU-only; `GPUSimpleGraph` is the separate portable evaluator API.

## Package layering

Engine depends on graph; graph depends on gpgpu; gpgpu depends on core and shadertools.
Neither graph nor gpgpu imports engine, including in public resource types. Both GPUGraph
and GPUSimpleGraph use the shared gpgpu execution/resource primitives. GPUGraph remains
WebGPU-focused; this layering does not add WebGL algorithm fallbacks.

Engine-specific integration is available through `@luma.gl/engine/physics` (scenegraph
physics), `@luma.gl/engine/tables` (table models and geometry), and
`@luma.gl/engine/models` (specialized path/polygon rendering). GPU data processing remains
in graph. Shared effect lowering must use gpgpu primitives instead of importing engine
models or renderers.

`yarn test-package-layering` checks source, built code, public declarations, and package
dependencies. It also runs as part of the package build.
