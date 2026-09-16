# @luma.gl/experimental/gpu-project

High-precision, GPU-resident coordinate reprojection for WebGPU command graphs.

`gpu-project` separates projection semantics from projection execution. An application
supplies any CPU projection provider, including `Proj4Projection` from
`@math.gl/proj4`. The CPU samples that provider using JavaScript Float64
arithmetic and compiles adaptive local polynomial patches. A `GPUProjection`
contributor evaluates those patches over GPU-resident coordinates using fast
Float32 operations and origin-relative precision.

This supports projection families understood by the provider without separately
implementing every projection, datum, or coordinate reference system in WGSL.

The [GPU Project implementation roadmap](../../../../dev-docs/roadmaps/gpu-project-roadmap.md)
tracks the planned precision tiers, operation compiler, native projection families, datum support,
and graduation tranches.

## Attribution and licensing

GPU Project is inspired by
[NVIDIA RAPIDS cuProj](https://github.com/rapidsai/cuspatial/tree/branch-25.04/cpp/cuproj), the
projection component maintained in the archived cuSpatial repository. That upstream project is
distributed under the [Apache License 2.0](https://github.com/rapidsai/cuspatial/blob/branch-25.04/LICENSE).

This module is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation; its TypeScript/WGSL adaptive-polynomial execution does not copy or translate
cuProj source code. It does not claim CUDA API compatibility, native GPU Float64 arithmetic, cuProj
feature or precision parity, NVIDIA affiliation, or NVIDIA endorsement.

## Compile and execute a projection

For manually composed transformations and inline shader use, see
[Compose a projection program](#compose-a-projection-program). The provider-driven API below
remains available for a single adaptive transformation.

```ts
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUProjection,
  compileProjectionPlan
} from '@luma.gl/experimental/gpu-project';
import {Proj4Projection} from '@math.gl/proj4';

// Register any CRS definition that the installed projection provider does not
// already include.
Proj4Projection.defineProjectionAliases({
  'EPSG:32610': '+proj=utm +zone=10 +datum=WGS84 +units=m +no_defs'
});

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

With math.gl 5, `from` and `to` can also be compatible CRS definitions from `@math.gl/crs`,
including PROJJSON objects. `@math.gl/proj4` checks whether each definition is executable by
proj4js; `gpu-project` then samples that provider on the CPU and evaluates the resulting local
approximation on the GPU. CRS metadata alone does not perform a transformation.

`bounds` are `[minimumX, minimumY, maximumX, maximumY]` in the source
coordinate system. `tolerance` is expressed in the destination coordinate
system's units; when the destination is a meter-based CRS, `0.01` requests a
sampled error of at most one centimeter.

Projection definitions and datum support remain the provider's responsibility.
`@math.gl/proj4` is optional and is not a dependency of `@luma.gl/experimental`.
A provider can instead be any object exposing `project(coordinates)` or a
standalone projection function.

For the common WGS84-to-Web-Mercator case, `gpu-project` also includes a
zero-dependency provider with forward projection, inverse projection, and
standard EPSG:3857 polar clamping:

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

## Preserve coordinate precision

GPU output consists of Float32 XY coordinates relative to
`plan.destinationOrigin`. Do not add that large global origin back into a
Float32 coordinate before rendering. Keep the origin in CPU Float64, combine it
with a camera-relative origin, or otherwise preserve the local coordinate
system through downstream GPU passes.

Two packed input formats are supported:

- `float32x2` stores ordinary GPU Float32 coordinates.
- `uint32x4` stores two raw Float64 values as the native low/high Uint32 words
  of a `Float64Array`.

For raw Float64 positions, the shader subtracts each patch's binary64 source
origin before converting the resulting local offset to Float32. This preserves
small coordinate differences that would disappear if a large easting,
northing, longitude, or latitude were converted directly to Float32.

## Adaptive patches and explicit assignment

`compileProjectionPlan` samples the supplied projection and recursively divides
areas whose local polynomial exceeds the requested tolerance. `degree` accepts
`1`, `2`, or `3`; `maxDepth` bounds subdivision. Compilation fails if the error
budget cannot be reached within that limit.

By default, `GPUProjection` locates the appropriate patch for every input row.
Applications that already own spatial bins can supply a source-aligned Uint32
`patchIds` view instead:

```ts
import {findProjectionPatch} from '@luma.gl/experimental/gpu-project';

const patchId = findProjectionPatch(plan, sourceCoordinate);

new GPUProjection({
  positions: sourcePositions,
  output: projectedPositions,
  patchIds: sourcePatchIds,
  plan
}).addToGraph(graph);
```

Supplying `patchIds` also avoids scanning every projection patch for each input
row, which is important for large plans and raw Float64 coordinate streams.

`findProjectionPatch` returns `-1` outside the compiled bounds. For CPU-side
verification or picking, `evaluateProjectionPlan(plan, coordinate, patchId?)`
returns an absolute destination coordinate rather than a GPU-local offset.

Non-finite input coordinates, rows outside the compiled source bounds, invalid
patch IDs, and patch IDs that do not cover their assigned row produce zero output.
Supply a caller-owned `uint32` `validity` column to distinguish invalid rows (`0`)
from legitimate zero coordinates (`1`). Patch
lookup tolerates float32 normalization at shared seams and inclusive endpoints,
but that tolerance never expands the plan's exterior source bounds.

Graph vector inputs preserve their ordered source chunks, including empty
chunks. Source positions, optional patch IDs, and output positions must share
the same row and chunk topology; `gpu-project` never concatenates or implicitly
repacks application-owned vectors.

`GPUProjection.updatePlan(nextPlan)` updates an equally sized packed plan
without recompiling the surrounding command graph. Plans produced by
`packProjectionPlan()` keep the exact outer bounds in the same storage as the
patch records, so per-encoding plan-buffer replacements cannot separate domain
validation from the polynomial data they accompany. Packed buffers created
before the bounds trailer was added are not accepted; repack the plan with the
current `packProjectionPlan()` result. Call
`GPUProjection.destroy()` when the contributor is no longer needed; only its
privately allocated plan storage is destroyed, never
caller-owned source, destination, or explicitly supplied `planBuffer` storage.

## Compose a projection program

`ProjectionProgram` describes an ordered two-dimensional transformation. The initial operations
are axis permutation, scalar unit conversion, per-axis affine scale/offset, and adaptive projection
plans. `compileProjectionProgram` specializes that sequence into straight-line WGSL calls and a
packed parameter buffer. Adaptive stages retain their patch lookup; there is no per-row operation
interpreter. Compiling a program allocates no GPU resources.

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
  validity: outputValidity
});
contributor.addToGraph(graph);

// Absolute double-single output can feed another program without CPU readback or repacking.
const inverse = compileProjectionProgram(invertProjectionProgram(program), {
  inputFormat: 'float32x4'
});
```

Axis/unit/affine/adaptive intermediates use integer-controlled double-single arithmetic. Inputs
can be `float32x2`, raw binary64 `uint32x4`, or absolute double-single `float32x4`. `double-single`
output is `[xHigh, xLow, yHigh, yLow]`. For `local-f32`, the final result is translated by the
program's binary64 `destinationOrigin` (default `[0, 0]`) before rounding to `float32x2`.
The explicit `web-mercator` operation opts into Float32 formula arithmetic, independently of output
format. All other stages retain double-single in both output modes; the existing
`GPUProjection` retains its faster local Float32 evaluator.

Use a hardware WebGPU adapter for program execution. Integer-fp64 program shaders can exceed
practical compilation budgets on software adapters such as SwiftShader. CPU compiler tests run
on all CI hosts; the numerical program suite explicitly requires hardware WebGPU, as do the P.1
double-single projection tests.

Raw binary64 input is converted to double-single at entry. When the first operation is adaptive,
it instead preserves P.1's raw binary64 origin subtraction before narrowing. Double-single has
approximately 48 significant bits within the Float32 exponent range, not IEEE binary64 semantics.
Native operations require nonzero scale factors and finite representable parameters; non-finite
intermediates and final overflows invalidate the row.

An adaptive operation is `{type: 'adaptive', plan, inversePlan?}`. Compile both supplied plans with
`precision: 'double-single'`. Each plan's bounds apply in that stage's input coordinate system.
Double-single input bounds are rounded inward to avoid expanding the exact binary64 domain.
`invertProjectionProgram` reverses stage order and direction, and requires an explicit inverse plan
for every adaptive stage. Its optional `destinationOrigin` specifies the inverse's local output
origin; local Float32 output must be reconstructed before feeding an inverse program.

`evaluateProjectionProgram` is an absolute-coordinate CPU reference returning `{position, valid}`.
It does not simulate GPU rounding. Adaptive plan tolerances remain sampled, per-stage estimates:
program composition does not establish a global error bound, and later scaling can magnify earlier
error. Validate a complete program against its CPU provider over the intended domain.

### Numerical metadata and CRS planning

`CompiledProjection.metadata` snapshots dimensions, input encoding, per-stage arithmetic,
output frame/precision, validity, stage domains, and inversion support. The same inspection is
available through `getProjectionProgramMetadata`. Approximation error is `none`, `sampled-estimate`,
or `unknown`. Native scales propagate a preceding adaptive estimate in destination units; a second
adaptive stage reports unknown composed error because provider sensitivity and patch continuity
are not established. Estimates exclude input/native/output rounding and are never certified bounds.

The optional `@luma.gl/experimental/gpu-project/crs` subpath uses public math.gl 5 APIs. Install its
optional `@math.gl/crs` and `@math.gl/proj4` peers to use:

- `planProjectionPipeline({pipeline})`: parse a PROJ string or accept math.gl's AST, then lower
  signed 2D axis swaps, horizontal unit conversions, diagonal affine transforms, and stage inversion.
  Unsupported tokens produce structured reasons. An optional `fallback` supplies an oracle and
  bounds for the entire pipeline.
- `planCRSProjection({from, to, bounds?, tolerance})`: lower equivalent explicit PROJJSON frames
  into native double-single axis/unit/affine operations, or fit a bounded transformation through
  `Proj4Projection`. Native geographic frames support prime-meridian changes; equivalent Transverse
  Mercator and Pseudo Mercator conversions support false-origin changes without evaluating a
  projection. Datum identity and normalized ellipsoids must match. Set `enforceAxis` to honor
  declared axes, or `allowAdaptive: false` to require native lowering. Only adaptive routes need
  bounds and separately fitted inverse domains. Explicit non-2D/dynamic objects, unsupported axis
  semantics, and providers returning extra components are declined.

Both return a discriminated `ready`/`unsupported` result. A ready result includes `program`,
`compiled`, execution `strategy`, and fallback `reasons`; it can be consumed inline or by
`GPUProjectionProgram`. Defaults preserve raw binary64 input and double-single output. Fitting
tolerance remains sampled and excludes final local Float32 rounding. Native plans preserve declared
per-axis units; adaptive fallback declines geographic non-degree units, mixed projected units, and
non-numeric prime-meridian quantities unsupported by the current provider.

`projectionArithmetic: 'float32'` opts into native Web Mercator forward/inverse formulas for explicit
same-datum PROJJSON geographic/Pseudo Mercator pairs, and `webmerc` PROJ pipeline steps. The program
operation is `{type: 'web-mercator', arithmetic: 'float32', radius, inverse?}`. It consumes relative
radians and produces metres (inverse reverses this), rejects coordinates outside the square-world
domain, and never wraps/clamps coordinates. Formula stages expose `float32` arithmetic and program
metadata exposes `mixed`; double-single output storage does not restore formula precision.

Default higher-precision CRS planning fits the normalized binary64 Web Mercator reference into
double-single patches. It does not use the current provider's incorrect ellipsoidal interpretation
of explicit Pseudo Mercator PROJJSON. Provider-only transformations involving such objects decline.
Native UTM/TM formulas and analytic/adaptive comparative benchmarks remain the next P.4 work.
GPU execution does not import math.gl or proj4js.

See the [API guide](../../../../docs/api-reference/experimental/gpu-project.md) for examples,
supported units/parameters, error semantics, and planning limitations.

### Inline shader consumption

```ts
const shader = projection.getShader({namespace: 'map'});
const parameterWords = projection.packParameters();
// Upload parameterWords to a storage buffer bound under shader.bindingName.
// Include shader.source in a Model/Computation shader, with shader.modules and shader.defines.
// The generated callable for this example is:
// projection_map_project(position: vec4u, inputValidity: u32)
// It returns a struct with .position: vec4f and .valid: u32.
```

The returned shader has no entry point, dispatch, or output buffer. It can be called directly from
a render or analysis shader. Each use can select a namespace and a parameter word offset for
embedding in a larger buffer. Preserve declaration order when assigning `@binding(auto)` locations:
the generated parameter binding appears where `shader.source` is inserted. Pass the returned
modules and defines to enable the integer-controlled fp64 implementation.

Pass upstream row validity to the callable, or use the contributor's `inputValidity` column.
Zero validity short-circuits evaluation and produces zero output with zero validity. Valid zero
coordinates remain valid. Materialized input, output, and validity views must have matching chunks,
including empty chunks. The contributor owns only its parameter buffer.

`contributor.updateProjection(nextCompiledProjection)` updates parameters without changing the
shader or graph. `projection.isCompatible(nextCompiledProjection)` reports whether the shader and
parameter layout match. Numeric scales, offsets, origins, coefficients, and same-sized adaptive
plans may change; operation order, direction, axis permutation, patch counts, input format, and
output precision may require recompilation. Updates perform a buffer write, with no hidden command
submission or readback. Inline consumers can write `nextCompiledProjection.packParameters()` into
their own buffer after the same compatibility check.

## Benchmark CPU and GPU projection paths

The optional benchmark helpers compare the same deterministic source rows and
report nearest-rank timing distributions in milliseconds plus coordinates per
second:

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

The isolated `/benchmarks` entry point keeps benchmark infrastructure out of the
normal `gpu-project` bundle. The CPU report measures plan compilation, direct provider
calls, automatic patch scans, and preassigned patch IDs. The GPU report includes those same CPU
baselines plus `float32x2` and raw binary64 `uint32x4` inputs, each with both
patch-selection strategies. Each measured GPU dispatch waits for a device
fence; its synchronized throughput includes submission and completion but
excludes graph setup, position uploads, result validation, and readback. Devices
supporting `timestamp-query` also report compute-pass-only timing and throughput.

Every GPU path reports `synchronizedSpeedupOverCPUProvider`, comparing its
end-to-end synchronized throughput with direct CPU projection. Timestamp-enabled
paths also report `gpuSpeedupOverCPUProvider` for compute-pass-only throughput.
Float32 paths are validated against their actual rounded source positions;
raw binary64 paths and the shared CPU baseline retain their original coordinates.

The reproducible browser benchmark can also be run from the repository root;
the environment variable selects a representative dataset while ordinary CI
uses a small smoke-test dataset:

```sh
VITE_LUPROJ_BENCHMARK_ROWS=16384 yarn test-headless \
  modules/experimental/test/gpu-project/projection-benchmark.spec.ts --reporter=verbose
```

## Accuracy boundaries

The reported error is sampled, not a formal global error bound. Keep plans
within smooth, continuous regions of the chosen transform. Split inputs at
antimeridian discontinuities, projection singularities, incompatible UTM zones,
or abrupt datum-grid boundaries, and validate representative application data
against the Float64 provider.

Higher latitudes and strongly curved transforms may require smaller patches,
higher polynomial degree, or a larger subdivision limit. The source and
destination CRS, axis order, grid availability, and datum behavior are entirely
determined by the projection provider.
