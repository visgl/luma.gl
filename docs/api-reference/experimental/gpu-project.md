import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUExampleCard} from '@site/src/components/docs/gpu-example-card';
import {ProjectionBenchmark} from '@site/src/components/docs/projection-benchmark';

# GPU Project

<ExperimentalDocsTabs active="gpu-project" />

## Overview

`@luma.gl/experimental/gpu-project` reprojects GPU-resident coordinates through WebGPU command graphs
without requiring native GPU `f64` arithmetic. A JavaScript projection provider defines the
coordinate-reference-system semantics; adaptive local polynomial patches provide the GPU execution
strategy.

That separation supports the wide range of coordinate systems handled by `@math.gl/proj4` without
reimplementing every projection, datum, or coordinate-reference-system definition in WGSL.

## When to use it

Use GPU Project when many GPU-resident coordinates share a bounded source region and projected results
will remain on the GPU. Use a direct CPU projection when the dataset is small, unbounded, or
immediately needed by JavaScript.

## Attribution and licensing

GPU Project is inspired by
[NVIDIA RAPIDS cuProj](https://github.com/rapidsai/cuspatial/tree/branch-25.04/cpp/cuproj), the
coordinate-projection component of the archived cuSpatial project. cuProj and cuSpatial are
distributed under the [Apache License 2.0](https://github.com/rapidsai/cuspatial/blob/branch-25.04/LICENSE).

GPU Project is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation. Its provider-driven adaptive polynomial patches and TypeScript/WGSL WebGPU
execution do not copy or translate cuProj source code. It is not an API-compatible CUDA port, does
not claim native GPU Float64 arithmetic or cuProj precision and feature parity, and is neither
affiliated with nor endorsed by NVIDIA.

## Live CPU versus WebGPU benchmark

This benchmark runs locally in your browser when you click the button. Every implementation receives
the same deterministic WGS84 coordinate rows and converts them into Web Mercator. The direct
Float64 CPU provider is the reference; the other paths compare compiled CPU evaluation with actual
WebGPU execution over both `float32x2` and raw binary64 `uint32x4` source coordinates.

<GPUExampleCard
  demonstrates={['adaptive projection patches', 'precision modes', 'CPU/GPU oracle parity']}
  input="Deterministic WGS84 coordinates"
  gpuOutput="Projected Web Mercator coordinates"
  cpuReadback="Correctness samples and timing summaries"
  execution="Explicit benchmark runs; no background animation"
  compatibility="WebGPU with a CPU reference fallback"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/website/src/components/docs/projection-benchmark.tsx"
  inspectorHref="/docs/api-reference/experimental/gpu-core/concepts#instrumentation-and-autotuning"
/>

<ProjectionBenchmark />

The GPU measurements synchronize each submission before stopping the timer. They include submission
and completion, but exclude source uploads, command-graph compilation, correctness readback, and
validation. Where the device supports timestamp queries, the results also include compute-pass-only
throughput. Every GPU path must agree with its source-format CPU oracle before results are shown.

These measurements describe your browser, adapter, workload, and thermal state; they are not static
published results or cross-machine performance guarantees.

## Quick start

```ts
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPUProjection, compileProjectionPlan} from '@luma.gl/experimental/gpu-project';
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

With math.gl 5, `Proj4Projection` also accepts compatible CRS definitions from `@math.gl/crs`,
including PROJJSON objects. Use `checkProj4CRSCompatibility()` when a broader CRS metadata object
may include unsupported vertical or compound components; CRS metadata by itself does not transform
coordinates.

```ts
import {
  compileProjectionPlan,
  createWebMercatorProjection
} from '@luma.gl/experimental/gpu-project';

const plan = compileProjectionPlan({
  projection: createWebMercatorProjection(),
  bounds: [-122.55, 37.7, -122.35, 37.85],
  tolerance: 0.01
});
```

## Choose coordinate precision

`GPUProjection` accepts two source storage formats and two execution modes:

| Source format | Storage | Precision contract |
| --- | --- | --- |
| `float32x2` | Two GPU Float32 values | Fast native source coordinates |
| `uint32x4` | Native low/high Uint32 words of two JavaScript Float64 values | Exact binary64 transport into local Float32 or double-single evaluation |

For binary64 coordinates, the shader subtracts each patch's source origin before converting the
remaining local offset to Float32. This preserves small differences between large eastings or
northings that would disappear if the original coordinates were converted directly to Float32.

The default `local-f32` mode writes `float32x2` output relative to `plan.destinationOrigin`. Keep
that origin in JavaScript Float64, combine it with a camera-relative origin, or preserve local
coordinates through downstream GPU work. Adding a large global origin back into a Float32 output
would discard the recovered precision.

Set `precision: 'double-single'` on both the plan compiler and `GPUProjection` to use the
optimizer-resistant `fp64arithmetic` shader module for source normalization and polynomial
evaluation. This mode writes absolute `float32x4` rows ordered as
`[xHigh, xLow, yHigh, yLow]`:

```ts
const plan = compileProjectionPlan({
  projection,
  bounds: [580_000, 4_085_000, 600_000, 4_105_000],
  tolerance: 0.01,
  precision: 'double-single'
});

new GPUProjection({
  precision: 'double-single',
  positions: sourcePositions,
  output: absoluteDoubleSinglePositions,
  validity: projectedPositionValidity,
  plan
}).addToGraph(graph);
```

Double-single carries up to approximately 48 significant bits while values remain in the normal
Float32 exponent range. It is not IEEE-754 binary64: it improves significand precision without
providing binary64's exponent range or exact rounding semantics. `plan.maxError` reports the
validation error for the selected mode; `float32MaxError` and `doubleSingleMaxError` expose both
simulated paths for inspection.

## Projection programs and inline shaders

`compileProjectionProgram(program, {inputFormat})` compiles an explicit sequence of two-dimensional
operations. The initial operation set includes axis permutation, unit conversion, per-axis affine
scale/offset, and adaptive plans. The same `CompiledProjection` supports materialized GPU Graph
output and inline calls from rendering or analysis shaders.

```ts
import {
  compileProjectionProgram,
  GPUProjectionProgram,
  invertProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';

const program: ProjectionProgram = {
  precision: 'double-single',
  operations: [
    {type: 'axis', order: [1, 0]},
    {type: 'unit', factor: Math.PI / 180},
    {type: 'affine', scale: [2, -3], offset: [1_000_000, 2_000_000]}
  ]
};
const projection = compileProjectionProgram(program, {inputFormat: 'uint32x4'});
const contributor = new GPUProjectionProgram({
  projection,
  positions: sourcePositions,
  output: doubleSinglePositions,
  inputValidity: sourceValidity,
  validity: projectedValidity
});
contributor.addToGraph(graph);

const inverse = compileProjectionProgram(invertProjectionProgram(program), {
  inputFormat: 'float32x4'
});
```

Program inputs support `float32x2`, raw binary64 `uint32x4`, and absolute double-single `float32x4`.
All intermediate arithmetic uses double-single. The selected precision controls the output:
`double-single` emits absolute high/low pairs; `local-f32` subtracts `program.destinationOrigin`
(default `[0, 0]`) before rounding the final result to `float32x2`. Raw input is narrowed at entry
except when the first stage is adaptive, which retains exact binary64 source-origin subtraction.
Use a hardware WebGPU adapter: integer-fp64 program shaders can exceed practical compilation
budgets on software adapters such as SwiftShader.

Add `{type: 'adaptive', plan, inversePlan?}` to include an adaptive transformation. Both plans must
use `precision: 'double-single'`, and each plan's bounds apply to its own stage input. Inversion
reverses the sequence and requires an explicit inverse plan for adaptive stages. Program composition
does not establish a global error bound: per-stage sampled tolerances can be amplified by later
operations. `evaluateProjectionProgram(program, coordinates)` provides an absolute-coordinate CPU
reference returning `{position, valid}`, not a simulation of GPU rounding.

For inline use, call `projection.getShader({namespace: 'map', parameterOffset: 0})`. Include its
`source`, `modules`, and `defines` in the consumer shader and bind uploaded `packParameters()` under
the returned `bindingName`. The returned `entryPoint` names a callable taking a coordinate and a
`u32` validity flag, returning a struct with `position` and `valid`. There is no generated compute
entry point or intermediate output buffer. `parameterOffset` is in Uint32 words relative to the
bound buffer range; namespaces allow multiple programs in one shader. Match `@binding(auto)`
declaration order in the consumer's shader layout.

Zero input validity, non-finite intermediates, and rejected domains produce zero output and validity.
The graph contributor preserves source chunks, including empty chunks, and owns only its parameter
buffer. Input, output, and validity columns remain caller-owned.

`projection.isCompatible(nextProjection)` checks whether the generated shader and parameter layout
are unchanged. `contributor.updateProjection(nextProjection)` then writes the new parameters without
rebuilding or submitting the graph. Numeric parameters and same-sized adaptive plans can change;
changes to operation topology, direction, axis permutation, precision, or input encoding can require
recompilation. Inline consumers can perform the same check and update their own parameter buffer.

## Numerical metadata

`CompiledProjection.metadata` is an immutable snapshot of a two-dimensional program's input
encoding, intermediate arithmetic, output precision/frame, validity rules, and inversion support.
`getProjectionProgramMetadata(program, inputFormat?)` also exposes this contract before compilation.
Each stage records its input domain (`inputBounds`, or `null` for finite-coordinate native stages),
inversion support, and accumulated approximation error in that stage's output units. Adaptive
bounds describe stage coordinates, not necessarily the original input coordinates.

`approximationError` distinguishes three cases:

- `none`: no adaptive approximation is present. This does not mean floating-point arithmetic is exact.
- `sampled-estimate`: the first adaptive plan's sampled double-single error, amplified by subsequent
  unit/affine scales using their maximum absolute scale. Axis permutations preserve this estimate.
- `unknown`: a later adaptive stage needs a provider sensitivity/continuity bound that is not
  available, or the estimate overflows. `maximum` is `null` in this case.

`guaranteed` is always `false`. These values exclude input quantization and subsequent native/output
arithmetic rounding; they must not be used as certified global error bounds. `local-f32` output
still rounds at the final origin-relative output boundary.

## Optional math.gl CRS planner

Install `@math.gl/crs` and `@math.gl/proj4` 5.x separately and import the CPU planner from
`@luma.gl/experimental/gpu-project/crs`. These optional peers are not loaded by the GPU execution
entry point. Planning allocates no GPU resources and returns either
`{status: 'ready', strategy, program, compiled, reasons}` or `{status: 'unsupported', reasons}`.
The default is raw binary64 `uint32x4` input and double-single output.

```ts
import {planCRSProjection} from '@luma.gl/experimental/gpu-project/crs';
import {GPUProjectionProgram} from '@luma.gl/experimental/gpu-project';

const result = planCRSProjection({
  from: 'EPSG:4326',
  to: '+proj=utm +zone=10 +datum=WGS84 +units=m',
  bounds: [-122.5, 37.7, -122.3, 37.9],
  tolerance: 0.001
});
if (result.status === 'ready') {
  const contributor = new GPUProjectionProgram({
    projection: result.compiled,
    positions: rawBinary64Positions,
    output: doubleSinglePositions,
    validity
  });
  contributor.addToGraph(graph);
  // result.compiled.getShader() exposes the same transformation for inline use.
}
```

`planCRSProjection` first tries native coordinate-frame lowering for explicit two-dimensional
geographic/projected PROJJSON objects. Otherwise it fits the entire transformation through the
public math.gl `Proj4Projection` provider. Named/serialized definitions use the provider path;
identifiers are not resolved into PROJJSON or downloaded. Explicit 3D, compound, bound, vertical,
geocentric, and dynamic-frame objects are declined. Providers returning extra coordinate components
are rejected. Unknown identifiers, unavailable resources, invalid provider output, and exhausted
patch budgets return structured reasons. `allowAdaptive: false` requires a native plan.

### Native PROJJSON coordinate frames

Native plans use only double-single axis/affine operations and need no provider sampling or fitting
bounds. Supported transformations are:

- Geographic frames with the same explicit static datum/ensemble and ellipsoid: cardinal axis
  order/direction, separate angular units per axis, and prime-meridian longitude changes.
- Equivalent Transverse Mercator (EPSG method 9807) or Popular Visualisation Pseudo Mercator
  (EPSG method 1024) conversions: cardinal axes, separate linear units, and false-easting/northing
  changes. The method, latitude of natural origin, Greenwich-relative central meridian, scale,
  datum identity, and normalized ellipsoid must match exactly.

This eliminates a redundant inverse/forward projection pair; it does **not** implement native
Mercator or UTM projection formulas. Different zones, projection families, or reference frames do
not cancel. Matching ellipsoid dimensions or CRS names alone never establish datum equivalence.
Datum names, identifiers, anchors, and ensemble members/accuracy are compared conservatively;
inconclusive equivalence goes to the provider or is declined. Ellipsoid quantities normalize to
metres, angular quantities to radians, and conversion parameters use their explicit units.

The conversion subset requires all natural-origin parameters: EPSG 8801, 8802, 8806, and 8807,
plus 8805 for Transverse Mercator. Standard parameter/method names are accepted when EPSG IDs are
absent. Unknown parameters are never dropped. Units use PROJJSON's `degree`, `metre`, `unity`, or
an explicitly typed positive `conversion_factor`; prime-meridian numeric values mean degrees.
See the [PROJJSON specification](https://proj.org/en/stable/specifications/projjson.html).

```ts
// Both definitions are explicit PROJJSON objects describing the same projection frame,
// e.g. UTM zone 10N in east/north metres and north/east kilometres.
const result = planCRSProjection({
  from: sourcePROJJSON,
  to: targetPROJJSON,
  enforceAxis: true,
  allowAdaptive: false
});
if (result.status === 'ready') {
  // No fitted patches or inverse-domain estimate are needed.
  const inverse = invertProjectionProgram(result.program);
}
```

Native plans do not wrap longitude, clamp latitude, or derive validity limits from CRS usage
extents. Explicit axis ranges and axis meridians are declined. Bounds, fitting budgets, and
`inverse` fitting options apply only to adaptive plans; native inverses are always available.
Native approximation metadata is `none`, which excludes arithmetic/input/output rounding.
For local-f32 native output, the destination origin defaults to zero unless supplied.

### Adaptive provider planning

`bounds` is optional for native plans and required for adaptive plans (`bounds-required` if absent).
Unsupported native conversions retain a bounded provider fallback. Invalid quantities, ambiguous
parameters, unsupported axes, and dynamic frames are declined rather than silently approximated.
The current provider assumes geographic degrees and one shared projected-axis unit; explicit
non-degree geographic axes, mixed projected-axis units, and non-numeric prime-meridian quantities
are therefore declined **on the adaptive route**, even when native frame changes support them.
Serialized definitions retain the provider's coordinate conventions and resolution limitations.

`enforceAxis` defaults to `false`, matching math.gl's longitude/easting-first behavior; set it to
`true` to use declared CRS axes and directions. Native plans retain declared coordinate units
under either axis policy. `inverse: {bounds, tolerance}` requests a separately fitted inverse
over an explicit destination-coordinate domain; inverse tolerance uses the inverse's output units.
Forward bounds are never reused as inverse bounds. `degree`, `sampleCount`, `maxDepth`, and
`maxPatches` control fitting. The tolerance applies to the adaptive double-single stage and remains
a sampled estimate. If `precision: 'local-f32'` is selected, the default destination origin is the
provider's output at the source-domain center; final Float32 rounding is additional error.

### Explicit PROJ pipelines

```ts
import {parsePROJString} from '@math.gl/crs';
import {planProjectionPipeline} from '@luma.gl/experimental/gpu-project/crs';

const result = planProjectionPipeline({
  pipeline: parsePROJString(`+proj=pipeline
    +step +proj=axisswap +order=2,1
    +step +proj=unitconvert +xy_in=deg +xy_out=rad
    +step +proj=affine +s11=2 +s22=3 +xoff=100 +yoff=200`)
});
```

The planner accepts a string or the public math.gl `PROJStringAst`. Supported stages lower to static
native operations: signed 2D `axisswap`; `unitconvert` with `m`, `km`, `cm`, `mm`, `ft`, `us-ft`,
`rad`, `deg`, `grad`, or positive numeric linear factors; and diagonal `affine` with `s11`, `s22`,
`xoff`, `yoff`. Missing horizontal units default to metres. `+inv` reverses the entire stage,
including signed axis permutations. Incompatible unit categories and consecutive unit conversions
with mismatched units are declined.

Every token is consumed or declined. Global parameters, duplicate parameters, shear/rotation,
extra dimensions, nested pipelines, omission flags, grids, and native map-projection methods are
outside this initial lowering subset. Optional `fallback: {projection, bounds, tolerance, ...}`
supplies a CPU oracle for the **whole** pipeline when lowering is unsupported. Native programs do
not sample that oracle or use its bounds. Syntax and malformed-parameter errors do not fall back.
The planner never assumes proj4js implements arbitrary PROJ pipelines.

Operation semantics follow the published PROJ documentation for
[pipelines](https://proj.org/en/stable/operations/pipeline.html),
[axis swaps](https://proj.org/en/stable/operations/conversions/axisswap.html),
[unit conversion](https://proj.org/en/stable/operations/conversions/unitconvert.html), and
[affine transforms](https://proj.org/en/stable/operations/transformations/affine.html).

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

Source positions, optional patch IDs, output positions, and optional `uint32` validity rows must
preserve identical row counts and chunk boundaries. Invalid coordinates, positions outside the
exact plan bounds, and invalid patch IDs produce deterministic zero output. When `validity` is
provided, projected rows receive `1` and rejected rows receive `0`, so a legitimate zero coordinate
is unambiguous.

## Core concepts and data model

- A JavaScript projection provider owns coordinate-reference-system semantics.
- `compileProjectionPlan()` approximates that provider with adaptive polynomial patches.
- GPU execution selects a patch per coordinate or consumes caller-provided patch IDs.
- Binary64 source words preserve local precision before either evaluation mode.
- Local Float32 output remains relative to an explicit destination origin; double-single output is
  absolute high/low pairs.
- Optional validity rows distinguish rejected inputs from legitimate zero coordinates.

## Operations and API index

| Export | Responsibility |
| --- | --- |
| `compileProjectionPlan()` | Samples and subdivides a bounded projection into adaptive patches |
| `GPUProjection` | Adds local Float32 or fp64-backed double-single projection work to a caller-owned command graph |
| `createWebMercatorProjection()` | Provides a zero-dependency WGS84-to-Web-Mercator provider |
| Benchmark exports | Measure CPU and explicitly synchronized GPU projection paths |

## Limits and compatibility

- GPU Project is experimental and WebGPU-only.
- Plans cover explicit source bounds and polynomial degrees 1–3.
- `local-f32` output is `float32x2` relative to `destinationOrigin`; `double-single` output is
  absolute `float32x4` high/low pairs.
- Double-single improves significand precision but does not implement IEEE-754 binary64 range or
  semantics.
- Projection providers, plan compilation, assignment policy, submission, and fallback are
  application-owned.

## Reuse the benchmark programmatically

Benchmark infrastructure is isolated behind an optional package entry point:

```ts
import {createWebMercatorProjection} from '@luma.gl/experimental/gpu-project';
import {
  runGPUProjectionBenchmark,
  runProjectionBenchmark
} from '@luma.gl/experimental/gpu-project/benchmarks';

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
[GPU spatial query benchmarks](/docs/api-reference/experimental/gpu-core/gpu-spatial-query-benchmark),
and [GPU floating-point precision](/docs/api-guide/shaders/gpu-floating-point-precision) for related
GPU execution and precision techniques.
