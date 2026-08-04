import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {ProjectionBenchmark} from '@site/src/components/docs/projection-benchmark';

# GPU Coordinate Projection (luProj)

<ExperimentalDocsTabs active="luproj" />

`@luma.gl/experimental/luproj` reprojects GPU-resident coordinates through WebGPU command graphs
without requiring native GPU `f64` arithmetic. A JavaScript projection provider defines the
coordinate-reference-system semantics; adaptive local polynomial patches provide the GPU execution
strategy.

That separation supports the wide range of coordinate systems handled by `@math.gl/proj4` without
reimplementing every projection, datum, or coordinate-reference-system definition in WGSL.

## Live CPU versus WebGPU benchmark

This benchmark runs locally in your browser when you click the button. Every implementation receives
the same deterministic WGS84 coordinate rows and converts them into Web Mercator. The direct
Float64 CPU provider is the reference; the other paths compare compiled CPU evaluation with actual
WebGPU execution over both `float32x2` and raw binary64 `uint32x4` source coordinates.

<ProjectionBenchmark />

The GPU measurements synchronize each submission before stopping the timer. They include submission
and completion, but exclude source uploads, command-graph compilation, correctness readback, and
validation. Where the device supports timestamp queries, the results also include compute-pass-only
throughput. Every GPU path must agree with its source-format CPU oracle before results are shown.

These measurements describe your browser, adapter, workload, and thermal state; they are not static
published results or cross-machine performance guarantees.

## Compile and execute a projection

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {GPUProjection, compileProjectionPlan} from '@luma.gl/experimental/luproj';
import {Proj4Projection} from '@math.gl/proj4';

const projection = new Proj4Projection({
  from: 'EPSG:32610',
  to: 'EPSG:3857'
});

const plan = compileProjectionPlan({
  projection,
  bounds: [580_000, 4_085_000, 600_000, 4_105_000],
  tolerance: 0.01,
  degree: 3
});

const graph = new GPUCommandGraph(device);

new GPUProjection({
  positions: sourcePositions,
  output: projectedPositions,
  plan
}).addToGraph(graph);

const compiled = graph.compile();
const encoder = device.createCommandEncoder({id: 'project-visible-points'});
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
```

Bounds are `[minimumX, minimumY, maximumX, maximumY]` in the source coordinate system. Tolerance is
expressed in destination units: `0.01` requests one centimeter of sampled accuracy when the target
coordinate system uses meters.

`@math.gl/proj4` is optional and is not a dependency of `@luma.gl/experimental`. Any function or
object with a `project(coordinates)` method can provide the projection. For WGS84-to-Web-Mercator
applications, `createWebMercatorProjection()` provides a zero-dependency alternative:

```ts
import {
  compileProjectionPlan,
  createWebMercatorProjection
} from '@luma.gl/experimental/luproj';

const plan = compileProjectionPlan({
  projection: createWebMercatorProjection(),
  bounds: [-122.55, 37.7, -122.35, 37.85],
  tolerance: 0.01
});
```

## Preserve coordinate precision

`GPUProjection` accepts two source storage formats:

| Source format | Storage | Precision contract |
| --- | --- | --- |
| `float32x2` | Two GPU Float32 values | Fast native source coordinates |
| `uint32x4` | Native low/high Uint32 words of two JavaScript Float64 values | Exact binary64 transport and subtraction before Float32 local evaluation |

For binary64 coordinates, the shader subtracts each patch's source origin before converting the
remaining local offset to Float32. This preserves small differences between large eastings or
northings that would disappear if the original coordinates were converted directly to Float32.

The output is `float32x2` relative to `plan.destinationOrigin`. Keep that origin in JavaScript
Float64, combine it with a camera-relative origin, or preserve local coordinates through downstream
GPU work. Adding a large global origin back into a Float32 output would discard the recovered
precision.

## Adaptive patches and explicit assignment

`compileProjectionPlan()` samples the provider and subdivides regions until their local polynomial
fits the requested tolerance. `degree` accepts `1`, `2`, or `3`; `maxDepth` bounds subdivision.

By default, each GPU invocation scans the compiled patches to find its coordinate. Applications
that already know the patch assignment can provide a source-aligned `uint32` `patchIds` view to
avoid that per-row scan:

```ts
new GPUProjection({
  positions: sourcePositions,
  output: projectedPositions,
  patchIds: sourcePatchIds,
  plan
}).addToGraph(graph);
```

The live benchmark compares both selection strategies for both source formats. This makes the
cost of additional patches and the benefit of preassigned IDs directly observable on the active GPU.

Source positions, optional patch IDs, and output positions must preserve identical row counts and
chunk boundaries. Invalid coordinates, positions outside the exact plan bounds, and invalid patch
IDs produce a deterministic local output of `[0, 0]`.

## Reuse the benchmark programmatically

Benchmark infrastructure is isolated behind an optional package entry point:

```ts
import {createWebMercatorProjection} from '@luma.gl/experimental/luproj';
import {
  runGPUProjectionBenchmark,
  runProjectionBenchmark
} from '@luma.gl/experimental/luproj/benchmarks';

const options = {
  projection: createWebMercatorProjection(),
  bounds: [-123, 37, -122, 38] as const,
  degree: 2 as const,
  tolerance: 0.03,
  coordinateCount: 16_384,
  warmupIterations: 2,
  measuredIterations: 5
};

const cpuReport = runProjectionBenchmark(options);
const gpuReport = await runGPUProjectionBenchmark(device, options);
```

See [WebGPU Geospatial Kernels](/docs/api-reference/experimental/geospatial),
[GPU spatial query benchmarks](/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark),
and [GPU floating-point precision](/docs/api-guide/shaders/gpu-floating-point-precision) for related
GPU execution and precision techniques.
