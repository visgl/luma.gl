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

That separation supports the wide range of coordinate systems handled by `@math.gl/projection` without
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
import {Projection} from '@math.gl/projection';

// Register CRS definitions that are not included by the installed provider.
Projection.defineProjectionAliases({
  'EPSG:32610': '+proj=utm +zone=10 +datum=WGS84 +units=m +no_defs'
});

const projection = new Projection({
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

`@math.gl/projection` is optional and is not a dependency of `@luma.gl/experimental`. Any function or
object with a `project(coordinates)` method can provide the projection. For WGS84-to-Web-Mercator
applications, `createWebMercatorProjection()` provides a zero-dependency alternative:

With math.gl 5, `Projection` also accepts compatible CRS definitions from `@math.gl/crs`,
including PROJJSON objects, and executes them with the TypeScript projection engine. Use
`planCRSProjection()` when a broader CRS metadata object may include unsupported vertical or
compound components; it reports structured reasons for unsupported definitions. CRS metadata
by itself does not transform coordinates.

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
Axis, unit, affine, and adaptive intermediates use double-single. An explicitly requested
`web-mercator` operation uses Float32 formula arithmetic (see below). The selected precision
controls the output representation, not the precision of opted-in analytic formulas:
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
Each stage records its arithmetic and input domain (`inputBounds`, or `null` for finite-coordinate native stages),
inversion support, and accumulated approximation error in that stage's output units. Adaptive
bounds describe stage coordinates, not necessarily the original input coordinates.

`approximationError` distinguishes three cases:

- `none`: no adaptive approximation is present. This does not mean floating-point arithmetic is exact.
- `sampled-estimate`: the first adaptive plan's sampled double-single error, amplified by subsequent
  unit/affine scales using their maximum absolute scale. Axis permutations preserve this estimate.
- `unknown`: a later adaptive stage needs a provider sensitivity/continuity bound that is not
  available, or the estimate overflows. `maximum` is `null` in this case.

`guaranteed` is always `false`. These values exclude input quantization and subsequent native/output
arithmetic rounding and native series truncation; they must not be used as certified global error bounds. `local-f32` output
still rounds at the final origin-relative output boundary.

## Inline Cartesian rendering and CPU picking

`ProjectionRenderTransform` from the optional `/gpu-project/crs` entry point adapts a ready
`prepareCRSProjection()` result for inline rendering. `GPUProjectedPointLayer` from
`@deck.gl-community/gpu-layers` consumes that adapter in a WebGPU **non-geospatial Cartesian**
viewport, such as `OrthographicView`. No upstream deck API change or materialized coordinate buffer
is required.

```ts
import {ProjectionRenderTransform} from '@luma.gl/experimental/gpu-project/crs';
import {GPUProjectedPointLayer} from '@deck.gl-community/gpu-layers';

// prepared is the same ready result used by ProjectionTableTransform below.
const transform = new ProjectionRenderTransform(prepared, {
  origin: [550000, 4190000], // absolute destination coordinates, in destination axis order/units
  axes: [0, 1],             // render x/y select destination axes AFTER origin subtraction
  scale: [1, 1]             // signed render units per selected destination unit
});
const layer = new GPUProjectedPointLayer({
  id: 'projected-points',
  transform,
  getPosition: positionVector, // GPUVector<'uint32x4'>: raw binary64 pairs, not integer coordinates
  inputValidity: validityVector, // GPUVector<'uint32'>: nonzero means valid
  getSourcePosition: rowIndex => cpuCoordinates[rowIndex] ?? null,
  pickable: true,
  pointSize: 4,
  getColor: [32, 128, 255]
});
```

The frame is explicit: `common[i] = (destination[axes[i]] - origin[axes[i]]) * scale[i]`.
Signed scales support unit conversion and axis direction; `axes` supports axis order. There is no
implicit degree/metre conversion or inference that projected coordinates are deck map common space.
The adapter snapshots this frame, reuses the prepared adaptive operation and appends double-single
origin/axis/scale operations. Only the final small local position narrows to float32. Even a prepared
`local-f32` table transform is recompiled from its plan, not from already narrowed output.
The prepared provider/plan must remain unchanged throughout its use. The CPU `projectPosition()`
returns `{source, destination, common}` using the retained provider, or `null` outside the finite source
domain; in-domain provider failures propagate as `ProjectionTableError`.

Rendering is strictly 2D at common-space z = 0. Three-component CPU inputs are rejected, and the
layer rejects geospatial viewports, non-Cartesian coordinate systems, nonzero coordinate origins and
model matrices. Map/globe common-space conversion and altitude/vertical transformations remain
separate coverage work. This adapter does not infer an inverse from a screen position.

Inputs are borrowed same-device vertex buffers with aligned physical chunks, stable byte strides and
matching chunk byte offsets; null bitmaps must be converted explicitly into `inputValidity`. Empty
chunks preserve global row numbering. Invalid/masked/out-of-domain rows are discarded in both color
and picking passes. RGB picking is limited to 16,777,215 rows per layer. `getSourcePosition()` is called
only for a picked row; the caller maintains a CPU mirror matching GPU row order, or returns `null`.
Picking retains deck's `coordinate` and adds `gpuVector` chunk provenance plus `projection` from the
retained CPU transform. There is no hidden input readback.

Replace the `transform` object when changing the plan, CRS, origin, axes or units. The layer rebuilds
its owned model/parameter buffer, and picking immediately uses the replacement CPU transform.
Replacing input vectors or extensions also rebuilds the model; aligned appended chunks and buffer
content changes can reuse it. Color and point size update per-chunk uniform regions. Callers request
redraws after changing GPU contents. Finalization destroys only the layer's model, parameters and
style buffers, never its input vectors.

Hardware tests compare retained CPU, double-single table output and actual inline render/picking for
UTM points closer than an absolute float32 ULP. This proves the bounded consumer contract, not a
cross-vendor precision guarantee or a performance advantage. P.8a.2 measures those separately.

## Batch-preserving CPU/GPU table projection

`ProjectionTableTransform` from `@luma.gl/experimental/gpu-project/crs` uses a ready
`prepareCRSProjection()` result for explicit CPU or GPU execution. This first table adapter is
strictly 2D and requires the default raw-binary64 input format (`uint32x4` on GPU).
It retains the prepared CPU transform, original spatial references and sampled GPU error metadata.
Keep the prepared transform and its program unchanged while using the consumer.

```typescript
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  prepareCRSProjection,
  ProjectionTableTransform
} from '@luma.gl/experimental/gpu-project/crs';

const prepared = prepareCRSProjection({
  from: 'EPSG:4326',
  to: '+proj=utm +zone=10 +datum=WGS84',
  bounds: [-122.5, 37.7, -122.3, 37.9],
  tolerance: 0.0001
});
if (prepared.status !== 'ready') throw new Error('Unsupported projection');
const transform = new ProjectionTableTransform(prepared);

// CPU choice: each yielded batch owns its new binary64 positions and uint32 validity.
// cpuBatches is an iterable of {positions: Float64Array, inputValidity?: Uint32Array,
// sourceInfo?, metadata?}. Each positions array contains tightly packed coordinate pairs.
for (const output of transform.projectBatches(cpuBatches)) {
  consumeCPU(output);
}

// GPU choice: gpuTable is already resident. Upload is a separate application/Arrow-adapter step.
const projected = transform.createGPUProjectionTable(device, {
  id: 'utm-table',
  table: gpuTable,
  positions: 'coordinates', // packed uint32x4: x-low-word, x-high-word, y-low-word, y-high-word
  inputValidity: 'selected' // optional packed uint32: zero invalid, nonzero valid
});
const graph = new GPUCommandGraph(device);
projected.addToGraph(graph);
// projected.table has only positions and validity columns. Add downstream graph consumers here.
const compiled = graph.compile();
const encoder = device.createCommandEncoder();
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
// When submitted work completes and consumers no longer need these resources:
// compiled.destroy(); projected.destroy();
```

`projectBatch()` processes one batch; `projectBatches()` is a lazy synchronous iterator, so callers
can also process async streams with `for await (...) { transform.projectBatch(batch); }`.
Neither method concatenates batches. Source arrays (including subarray views), batch identity
and opaque batch metadata are preserved; output metadata and `sourceInfo` are copied.

Both paths keep row order and write deterministic zero positions with validity `0` for masked,
nonfinite or out-of-domain input. CPU output uses the retained provider, not the fitted polynomial.
An in-domain provider exception or nonfinite result throws `ProjectionTableError` with `rowIndex`,
`sourceInfo` and `cause`. The failing batch is never published; previously yielded batches remain
committed. Reusable scalar output is intentional: math.gl bulk prefix-commit failures must not
leak partially written batches or be mistaken for ordinary invalid GPU rows. GPU approximation
does not call the provider at runtime; it cannot report newly introduced provider failures.

| Path | Positions | Reconstruction for valid rows |
| --- | --- | --- |
| CPU | `Float64Array`, `encoding: 'float64-absolute'` | Absolute destination coordinates |
| GPU default double-single | `GPUVector<'float32x4'>` | `[xHigh + xLow, yHigh + yLow]` |
| GPU explicit local-f32 | `GPUVector<'float32x2'>` | Add `prepared.compiled.destinationOrigin` |

GPU output contains one owned position buffer and one owned validity buffer per source batch,
including empty batches. No unrelated source columns are copied into the derived table; use
`sourceInfo` or matching batch/row offsets to join application attributes. The validity column is
authoritative: output `nullCount` is not computed via hidden readback. The contributor snapshots
the current batch topology; create another contributor for subsequently appended batches.

Input chunks are borrowed and must remain alive until submitted work completes. Output aggregate
vectors borrow their chunks; `projected.destroy()` releases owned output and parameter buffers,
not the source table or graph. Registration is once-only and does not submit. On registration
failure, discard the partially constructed graph and destroy the contributor. Readback, repacking,
backend selection and CPU/GPU precision conversion are always application decisions.

The adapter rejects indexed tables, missing/constant selected columns, nonpacked layouts, native
null bitmaps and wrong-device/non-storage buffers. A batch declaring null rows requires an explicit
validity column; convert null bitmaps in a source adapter. Arrow ingestion/readback remains in
`@luma.gl/arrow`, not GPU Project. `GPUProjectionTable` is also exported from the engine-independent
`@luma.gl/experimental/gpu-project` entry point for already compiled binary64-input programs.

## Explicit longitude normalization

`{type: 'longitude-wrap', interval: [minimum, maximum], seamTolerance?}` reduces the first
coordinate into one declared turn using double-single arithmetic; the second coordinate is unchanged.
Use the current coordinate units: `[-180, 180]` or `[0, 360]` for degrees, `[-Math.PI, Math.PI]`
for radians. No CRS or pipeline implicitly inserts this operation, and PROJ `+over`/`+lon_wrap`
remain unsupported by the pipeline parser.

Both sides of the seam are invalid within `seamTolerance`, including the seam itself. The default
and minimum allowed tolerance is `period * 2^-32`; callers can enlarge it, but not to half a turn.
Invalid rows produce zero output and zero validity, never clamped coordinates. Inputs are bounded
to 1,024 turns below/above the interval. Periods must be between `2^-80` and `2^100`, and interval
endpoints must be within 1,024 periods of zero. These bounds leave guard bits for range reduction;
they do not extend double-single to IEEE binary64 exponent range. As with other domains, use inset
coordinates rather than depending on exact floating-point guard-band boundaries.

Metadata exposes the immutable `longitudeWrap` interval/seam policy and the input envelope.
Normalization is many-to-one: `invertible` is false and `invertProjectionProgram()` throws.
For inverse use, construct a separate conversion with an explicit unwrapped branch; it cannot
recover a discarded turn count. A preceding nonzero sampled error becomes `unknown` at this stage
because it could cross the seam.

To cross the antimeridian, move the seam away from the working region and wrap **before** a
smooth bounded plan. For example, a longitude-first, degree-based WGS84-to-zone-60 UTM plan over
`[179, -1, 181, 1]` can consume both `179.5` and `-179.5`:

```ts
const projection = compileProjectionProgram({
  ...planned.program,
  operations: [
    {type: 'longitude-wrap', interval: [0, 360]},
    ...planned.program.operations
  ]
}, {inputFormat: 'uint32x4'});
```

Here `planned` is a ready `planCRSProjection()` result for that unwrapped domain. This works with
either explicit native Float32 formulas or the default double-single adaptive plan. Do not fit an
adaptive polynomial across a discontinuity, and do not insert wrapping before projected metre
coordinates or a latitude-first axis without explicitly rearranging/converting those coordinates.

## Plan a caller-prepared projection

`planProjection()` compiles a caller-owned CPU transform into the same program used by
`GPUProjectionProgram` and inline WGSL, without importing math.gl or resolving CRS definitions.
This is the provider boundary for current math.gl projections and future engine-created transforms.

```ts
import {Projection} from '@math.gl/projection';
import {planProjection} from '@luma.gl/experimental/gpu-project';

const projection = new Projection({from: 'EPSG:4326', to: 'EPSG:3857'});
const result = planProjection({
  projection,
  bounds: [-122.55, 37.7, -122.35, 37.85],
  tolerance: 0.001
});
if (result.status === 'ready') {
  // Use result.compiled in GPUProjectionProgram, or result.compiled.getShader() inline.
  // Retain projection for CPU picking/reference calculations.
}
```

The provider may be a synchronous callback, an object with `project` and optional `unproject`,
or a `SynchronousProjectionProvider` with `projectSync` and optional `unprojectSync`.
When both pairs exist, the synchronous pair wins in both directions. Methods retain their
provider receiver. For a lazy transform, await its preparation before planning; this function
never calls `preload()`, starts imports, awaits callbacks, or retries through an asynchronous method.
An unprepared provider returns an unsupported result with its error message.

Unlike `planCRSProjection()`, this entry point always fits the supplied transform. It does not
replace a custom implementation with a native formula or reinterpret its aliases, axes or units.
Bounds are required and use the provider's input units; tolerance uses its output units.
Defaults are raw binary64 `uint32x4` input, double-single arithmetic and `float32x4` output.
The usual `precision`, `inputFormat` and `destinationOrigin` options remain available.

An optional `inverse: {bounds, tolerance}` fits the provider's inverse over an independently
declared destination domain. It requires the corresponding inverse method; no inverse is guessed.
Without this option the adaptive program cannot be automatically inverted, even if the CPU
provider has an inverse method.

This is strictly a two-coordinate contract. Every sample must return exactly two finite values;
explicitly `lossy: true` providers are declined. Opaque callbacks cannot be inspected for hidden
height, datum, grid or epoch dependencies: callers must supply a genuine bounded 2D transformation.
Accepting a provider is not a claim of GPU support for all of that provider's operations.
Sampled fitting errors are not certified global bounds, and final local-f32 rounding is additional.

The result uses the existing `ready`/`unsupported` union and supports
`onUnsupported: 'throw'`. `ProjectionPlanningError` is available from both the execution
entry point and the existing `/crs` entry point. Compilation takes a snapshot of sampled values,
does not retain the provider for execution, and allocates no GPU resources. Replan explicitly
after changing the provider's configuration; loading, caching and resource ownership stay with
the application.

## Optional math.gl CRS planner

Install `@math.gl/crs` and `@math.gl/projection` 5.x separately and import the CPU planner from
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
public math.gl `Projection` provider. Named/serialized definitions use the provider path;
identifiers are not resolved into PROJJSON or downloaded. Explicit 3D, compound, bound, vertical,
geocentric, and dynamic-frame objects are declined. Providers returning extra coordinate components
are rejected. Unknown identifiers, unavailable resources, invalid provider output, and exhausted
patch budgets return structured reasons. `allowAdaptive: false` requires a native plan.

### Engine preparation and spatial-reference metadata

`prepareCRSProjection()` and `prepareCRSProjectionAsync()` accept upstream `ProjectionEngine`
factories. The synchronous entry point never starts deferred loads; the async entry point awaits
`engine.createProjectionAsync()` before synchronous fitting. Both require explicit source bounds,
use the authoritative CPU transform as an opaque oracle, and always produce adaptive plans.
They never infer native formulas from a custom engine's CRS labels.

```ts
import {lazyProjectionEngine} from '@math.gl/projection/projections/lazy';
import {prepareCRSProjectionAsync} from '@luma.gl/experimental/gpu-project/crs';

const prepared = await prepareCRSProjectionAsync({
  engine: lazyProjectionEngine,
  from: 'EPSG:4326',
  to: 'EPSG:3857',
  bounds: [-1, -1, 1, 1],
  tolerance: 0.001
});
if (prepared.status === 'ready') {
  const cpuPosition = prepared.projection.projectToSync([0.3, 0.4], new Float64Array(2));
  // prepared.compiled is the corresponding GPU plan; preparation creates no GPU resources.
  // prepared.spatialReferences retains immutable original metadata, separate from GPU error.
}
```

The default is math.gl's eager `projectionEngine`. Custom alias, reader and datum configurations
require a matching public `normalization` configuration; the adapter cannot inspect an engine's
registry. Public normalization validates supported horizontal semantics, not the engine's custom
algorithm. Retained CPU transforms remain caller-owned. Later mutation of a custom CPU transform
does not update a previously sampled GPU plan: prepare again when semantics change.

Both preparation methods and `planCRSProjection()` accept `CRSReference` and `SpatialReference`.
Stored `coordinateOrder` takes precedence over authoritative CRS axes independently of
`enforceAxis`. Declared units must agree with the executable definition; they do not relabel or
rescale coordinates. Metadata wrappers use adaptive planning, even for otherwise native pairs.
Use the preparation methods when the typed result must retain CPU methods and metadata.

Unknown/absent horizontal CRS, non-2D storage, conflicting units/frames, separate vertical CRS,
coordinate epochs, lossy extraction, grids and nonzero datum shifts are rejected before sampling.
Raw PROJJSON/WKT dimensional checks remain necessary because normalized metadata can omit height.
No implicit WGS84 assumption, horizontal extraction, network CRS resolution or grid loading is
performed; only explicit async preparation may load algorithm modules. Both entry points return structured unsupported results, or throw
`ProjectionPlanningError` with `onUnsupported: 'throw'` (a rejected promise for async preparation).

### Native PROJJSON coordinate frames

Native plans use only double-single axis/affine operations and need no provider sampling or fitting
bounds. Supported transformations are:

- Geographic frames with the same explicit static datum/ensemble and ellipsoid: cardinal axis
  order/direction, separate angular units per axis, and prime-meridian longitude changes.
- Equivalent Transverse Mercator (EPSG method 9807) or Popular Visualisation Pseudo Mercator
  (EPSG method 1024) conversions: cardinal axes, separate linear units, and false-easting/northing
  changes. The method, latitude of natural origin, Greenwich-relative central meridian, scale,
  datum identity, and normalized ellipsoid must match exactly.

This eliminates a redundant inverse/forward projection pair without evaluating a projection
formula. Different zones, projection families, or reference frames do
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
Native approximation metadata is `none`, which excludes native series truncation and arithmetic/input/output rounding.
For local-f32 native output, the destination origin defaults to zero unless supplied.

### Native Web Mercator formulas

`projectionArithmetic: 'float32'` explicitly enables native forward/inverse Web Mercator for
PROJJSON geographic/Pseudo Mercator pairs and different Pseudo Mercator conversions. The datum
and ellipsoid must match. Units, signed axes, prime meridians, central meridians, and false origins
are normalized by the same frame planner. Equivalent conversions still cancel in double-single.
Serialized CRS strings are not resolved into native operations.

```ts
const result = planCRSProjection({
  from: geographicPROJJSON,
  to: pseudoMercatorPROJJSON,
  projectionArithmetic: 'float32', // Explicit lower-precision formula opt-in.
  allowAdaptive: false
});
```

The dependency-free program operation is
`{type: 'web-mercator', arithmetic: 'float32', radius, inverse?}`. It maps central-meridian-relative
longitude/latitude in radians to metres using the ellipsoid's semi-major axis as `radius`.
Affine stages handle central meridians and false origins. It implements spherical Pseudo Mercator,
not ellipsoidal Mercator. The [published PROJ formulas](https://proj.org/en/stable/operations/projections/webmerc.html)
are evaluated in equivalent `asinh(tan(latitude))` / `atan(sinh(northing / radius))` form to avoid
equatorial cancellation.

The stage's square-world domain is longitude ±π and latitude ±atan(sinh(π)) (approximately
85.05113 degrees); inverse easting/northing must be within ±π times `radius`. Values outside the
domain, non-finite values, and upstream-invalid rows produce zero output with zero validity.
There is no longitude wrapping or latitude clamping. Domain tests use the incoming double-single
coordinates before Float32 narrowing, with inward-rounded bounds. Boundary rounding can invalidate
an otherwise exact edge or a round trip; use an inset domain when validity must survive round trips.

Metadata reports program arithmetic as `mixed` and formula-stage arithmetic as `float32`, even
with binary64 inputs or double-single outputs. The formula writes zero low limbs; surrounding
double-single frame transforms can create nonzero low limbs without restoring lost formula
precision. A local output origin likewise does not recover that precision. Transcendental accuracy
is device-dependent; no global Float32 error or speedup guarantee is claimed. Sampled approximation
error excludes this rounding, and a preceding nonzero adaptive estimate becomes `unknown` through
the nonlinear stage.

The default `projectionArithmetic: 'double-single'` never silently selects this formula on the GPU.
For these supported CRS pairs, provide `bounds` and `tolerance` to fit the binary64 native CPU
reference into double-single adaptive patches, with independently bounded inverse fitting available.
This avoids the current provider's incorrect ellipsoidal interpretation of Pseudo Mercator PROJJSON.
`precision: 'local-f32'` alone does **not** opt into Float32 formula arithmetic.

### Native Transverse Mercator and UTM formulas

The same explicit `projectionArithmetic: 'float32'` option enables EPSG method 9807
Transverse Mercator for geographic/projected and different projected PROJJSON pairs, including
TM/Web Mercator composition. Datum/ellipsoid matching and frame normalization remain mandatory.
Equivalent conversions still cancel without evaluating a formula.

The operation is `{type: 'transverse-mercator', arithmetic: 'float32', semiMajorAxis,
semiMinorAxis, scaleFactor, latitudeOrigin, inverse?}`. Axes are in metres, `latitudeOrigin`
is radians, and scale must be positive. It accepts spheres and oblate ellipsoids with
`0.99 * semiMajorAxis <= semiMinorAxis <= semiMajorAxis`. Longitude is relative to the central
meridian; surrounding affine stages handle that meridian and false origins.

Forward input is restricted to relative longitude ±12 degrees and latitude ±85 degrees.
Inverse `inputBounds` is only a rectangular envelope: recovered geographic coordinates must
also satisfy that footprint. Poles, other branches, non-finite inputs and upstream-invalid rows
produce zero output and zero validity. There is no automatic zone selection, longitude wrapping,
latitude clamping, polar UPS, or datum transformation. UTM's `south` flag selects its false
northing, not a hemisphere validity restriction. Boundary-rounding caveats apply as for Web Mercator.

The independently implemented sixth-order series follows the
[published Transverse Mercator mathematics](https://proj.org/en/stable/operations/projections/tmerc.html).
The series is not exact TM, and Float32 GPU transcendental accuracy remains device-dependent.
Metadata reports `mixed` program arithmetic; double-single storage cannot recover formula precision.
The default higher-precision route instead fits the normalized binary64 series reference into
double-single adaptive patches, including independently fitted inverse plans. Sampled tolerance
is relative to that reference; native series truncation and input/output rounding are additional.
No global error bound, cuProj precision parity, or performance advantage is claimed.

### Adaptive provider planning

`bounds` is optional for native plans and required for adaptive plans (`bounds-required` if absent).
Unsupported native conversions retain a bounded provider fallback. Invalid quantities, ambiguous
parameters, unsupported axes, and dynamic frames are declined rather than silently approximated.
Public math.gl normalization validates horizontal frames, angular/linear units and datum metadata.
Uniform non-degree geographic units are supported. Mixed per-axis units and non-numeric
prime-meridian quantities remain declined **on the adaptive route**, even when native frame
changes support them. Normalization does not replace the identifier/conflict checks below.
The adaptive frontend additionally verifies Lambert Conic Conformal 1SP (EPSG 9801), Lambert Conic
Conformal 2SP (9802), and Albers Equal Area (9822). It resolves methods and parameters by their
EPSG `id`/`ids`, or by canonical EPSG names when identifiers are absent, then creates a provider-only
copy with normalized names and units. Custom CRS/conversion labels, empty display names, and the
absence of a registered CRS code are supported. Localized or empty method/parameter names work
when their EPSG identifiers resolve; conflicting identifiers or recognized names are rejected.
The caller's definition is not mutated and no registry lookup or network access is performed.

These are **adaptive coverage additions**, not native GPU formulas: all three families retain
double-single fitting/evaluation, explicit bounds, sampled error estimates, and separately fitted
inverse domains. Conic parameters must be complete, finite, unique, dimensionally consistent, and
nondegenerate. Unsupported variants (such as modified/Belgian/Michigan Lambert methods) are not
silently treated as ordinary 1SP/2SP. A method with neither a resolvable identifier nor an executable
name cannot be inferred from the parameter values alone.
Valid zero standard parallels are preserved by math.gl's TypeScript kernels. The former Lambert
rejection, 1SP tangent-parallel injection and Albers parallel swapping are no longer needed.

Outside these verified mappings, the provider's existing compatibility restrictions remain.
Serialized definitions remain available for provider-supported projections without a registered
CRS name. Entirely custom projection functions can use `compileProjectionPlan()` directly, or
the explicit whole-pipeline `fallback` of `planProjectionPipeline()`. Extra parameters on verified
methods are rejected instead of reaching a provider that might ignore them.
Provider-only routes now preserve explicit Pseudo Mercator PROJJSON's spherical formula and WGS84
datum semantics. Native Web Mercator pairs retain their bounded binary64 oracle for adaptive
planning so the established validity domain does not silently expand.
Serialized definitions retain the provider's coordinate conventions and resolution limitations.

Both `planCRSProjection()` and `planProjectionPipeline()` return structured `unsupported` results
by default. Set `onUnsupported: 'throw'` to throw `ProjectionPlanningError` instead; its immutable
`reasons` contain the same planning diagnostics, including missing bounds, unavailable providers,
and failed approximation budgets. This changes failure handling, not which semantics are accepted.
The error class is exported from the optional `gpu-project/crs` entry, not the execution core.

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

With `projectionArithmetic: 'float32'`, `webmerc` accepts exactly one of `+a=<radius>` or
`+ellps=WGS84`, optional decimal-degree `+lon_0`, metre `+x_0`/`+y_0`, and `+inv`.
Forward input is radians and output metres; inverse reverses those units. Adjacent unit
conversions must agree. For example:

```ts
const result = planProjectionPipeline({
  projectionArithmetic: 'float32',
  pipeline: `+proj=pipeline
    +step +proj=unitconvert +xy_in=deg +xy_out=rad
    +step +proj=webmerc +ellps=WGS84`
});
```

Every token is consumed or declined. Global parameters, duplicate parameters, shear/rotation,
extra dimensions, nested pipelines, omission flags, grids, longitude wrapping, and map-projection
methods outside the documented subset are outside native lowering. Unknown ellipsoids,
datum parameters, radian-suffixed origins, unsupported scale parameters, and `+over` are not silently discarded.
Optional `fallback: {projection, bounds, tolerance, ...}`
supplies a CPU oracle for the **whole** pipeline when lowering is unsupported. Native programs do
not sample that oracle or use its bounds. Syntax and malformed-parameter errors do not fall back.
The planner never assumes proj4js implements arbitrary PROJ pipelines.

With the same Float32 arithmetic opt-in, `utm` accepts `+ellps=WGS84`, an integer `+zone=1..60`,
optional bare `+south`, and `+inv`. `tmerc` accepts either `+ellps=WGS84` or explicit
`+a=<metres> +rf=<inverse flattening>` (`rf=0` means a sphere; otherwise `rf>=100`). Optional
`lon_0`/`lat_0` are decimal degrees, `x_0`/`y_0` are metres, and `k_0` is a positive scale.
Defaults are zero origins and unit scale. `+inv` reverses the full stage including its frame
transforms. Both consume radians and produce metres, with reversed units for inverse steps.
For example, replace the `webmerc` step above with `+proj=utm +ellps=WGS84 +zone=10`.
The local-branch domain and precision restrictions above apply; `+datum`, `+units`, `+approx`,
and `+algo` are not silently interpreted. Use explicit adjacent unit conversions.

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
| `planProjection()` | Fits a caller-prepared 2D provider into a compiled adaptive program with structured failure results |
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

### Native versus adaptive programs and inline versus materialized execution

`runProjectionProgramBenchmark(device, options)` accepts caller-supplied coordinates, an independent
absolute-coordinate `oracle(position) => {position, valid}`, and at least two named variants:
`{id, createProgram, maximumError}`. `createProgram()` returns a deterministic `ProjectionProgram`
and includes planning/fitting work in its measured interval. Use separate native-Float32 and
adaptive-double-single factories; do not use a variant's own evaluator as its oracle.
Factories using `planCRSProjection()` already compile internally; the separate program-compilation
column measures an additional standalone rebuild, not a decomposition of that factory's latency.

```ts
const report = await runProjectionProgramBenchmark(device, {
  coordinates: [[-122.4194, 37.7749], [-122.4194001, 37.7749001]],
  oracle: position => {
    const projected = independentProvider.project([...position]);
    return {position: [projected[0], projected[1]], valid: true};
  },
  variants: [
    {id: 'native', createProgram: createNativeProgram, maximumError: 20},
    {id: 'adaptive', createProgram: createAdaptiveProgram, maximumError: 1e-5}
  ],
  warmupIterations: 2,
  measuredIterations: 5
});
```

Import this helper from `@luma.gl/experimental/gpu-project/benchmarks`. All variants receive the
same raw binary64 input rows and must share output precision; origin-relative output must also
share its destination origin. Arithmetic metadata remains separate from output storage. Budgets
are Euclidean destination-unit errors including native formula, fitting, and output rounding.
Every row's validity and coordinates are checked before GPU warmups and again after timing;
any mismatch throws instead of returning a throughput report. Include representative edge and
invalid rows explicitly; passing finite samples is not a global accuracy guarantee.

Each variant runs an identical axis-swap consumer in two modes: `inline` embeds the callable
projection in that consumer, while `materialized` writes an intermediate coordinate/validity buffer
through `GPUProjectionProgram`, then runs the consumer. This minimal consumer measures that extra
storage/dispatch boundary, not an application's rendering cost. `consumerCount` (default `1`)
creates independent consumers with separate outputs in one submission: inline mode repeats
projection for each consumer, while materialized mode shares one projection result. Every
consumer's output and validity are checked, and all output buffers are included in memory totals.
This is within-submission reuse, not a cross-frame cache or an automatic execution policy.
Reports include actual adaptive-stage patch counts, polynomial degrees, bounds and fitting
tolerances, logical dispatch/projection counts, observed error,
valid-row count, parameter/intermediate/total buffer bytes, CPU planning/program-compilation
distributions, graph/pipeline setup time, first synchronized use, CPU encoding, fence-synchronized
execution, and optional GPU timestamp durations. Buffer totals exclude driver/pipeline memory and
temporary readback/query allocations. Uploads and readbacks are outside execution timings.
First-use/setup measurements are cache-sensitive, not cold-compiler guarantees. Run with other
GPU work idle, repeat on target devices, and compare accuracy budgets before interpreting speed.
The report labels comparisons as `equal-error-budget` or `different-error-budgets`; this refers
to the declared thresholds, not identical observed errors or a global guarantee. Throughput is
source rows per second for the **whole consumer workload**, not multiplied by consumer count.

`gpuTiming: false` disables optional GPU timestamps while retaining synchronized timing. Timestamp
instrumentation prevents the command graph from coalescing compute passes, so instrumented and
uninstrumented results must not be mixed when choosing an execution strategy. `timestampQueries`
records whether timestamps were actually used. First use and warmup are uninstrumented.
The GPU metric sums per-pass timestamp intervals; with independent consumers it must not be
interpreted as elapsed GPU latency or substituted for synchronized workload time.

### CPU provider comparison

`oracleLabel` identifies the CPU implementation used by the oracle callback; it does not resolve
or import a provider. `cpuProvider` records that label, and `cpuPaths` times two equivalent
axis-swap workloads using that callback: `inline` projects separately for every consumer;
`materialized` projects once, then copies the shared result to each consumer's output.
CPU outputs are preallocated binary64 coordinate arrays plus uint32 validity. They have the same
mathematical consumer contract as GPU results, but are **not the same memory encoding** as
double-single limbs or origin-relative Float32 GPU output. All CPU outputs are checked against
the captured reference before warmup and after timing. Reported CPU output/intermediate bytes
exclude JavaScript source objects, reference snapshots and provider-internal allocations.

`oracleTimeMilliseconds` remains a one-projection-per-row callback/checksum baseline, not a
matched multi-consumer workload. Current sweeps use math.gl **5.0.0-alpha.13's TypeScript engine**,
not a proj4js wrapper or the native C++ PROJ library. Provider construction and output allocation
are outside CPU execution timing; callback/provider allocations and consumer writes are inside it.

Pass `cpuVariants: createCRSProjectionCPUBenchmarks({projection, provider, isValid})`, importing
the helper from `/gpu-project/crs`, to compare the retained transform's `projectToSync`,
`projectFlatSync`, and `ProjectionBuffer` contiguous, strided and column APIs. `provider` should
include the actual package version. `isValid` must match the oracle's finite/domain predicate.
All six API/layout baselines run both consumer modes. Their domain checks, batch input packing,
scatter, zero/validity writes and consumers are timed. Reusable scalar output writes directly;
flat input is packed into its reusable in-place output. Buffers are reused;
`preparationTimeMilliseconds` and `scratchByteLength` record adapter preparation/allocation
separately. Scratch bytes exclude opaque provider/bulk internals and JS objects.
Coordinate failures propagate: partially committed bulk output never produces a successful report.
Every path is checked against the independent captured oracle before and after timing.
CPU variants may declare `maximumError` (absolute Euclidean destination units, default zero),
also accepted by `createCRSProjectionCPUBenchmarks`. Reports include allowed/observed CPU error.
Validity and invalid-row zeros remain exact. Timed execution must also reproduce its initial
validated outputs exactly; an error budget does not permit an unstable provider.

`cpuComparisons` retains API, layout and provider labels for each resident speedup, without assuming bulk
is fastest. `residentSpeedupOverCPU` retains its original allocating-scalar baseline for backward
compatibility. Reports also separate caller-measured CPU provider preparation, GPU resource
allocation/upload enqueue, the remaining upload/compile fence wait, and validation readbacks.
These overlapping setup phases are not isolated PCIe transfer measurements or an end-to-end
latency model. Resident speedups exclude them.

Each GPU path reports `encodeAndSynchronizedTimeMilliseconds`, the distribution of per-sample
CPU encoding plus submission-to-fence time. `residentSpeedupOverCPU` divides the **matching CPU
mode's median** by this GPU median (greater than one favors GPU; below one favors CPU). It is
`null` if either median is below timer resolution. This excludes GPU upload/readback and all
planning/compilation; it is not an end-to-end CPU-memory-to-CPU-memory speedup. CPU and GPU
arithmetic differ, so the explicit accuracy budget still governs the comparison.

The four reproducible fixtures cover Web Mercator, northern/southern UTM, and inverse UTM:

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true VITE_LUPROJ_BENCHMARK_ROWS=65536 \
  yarn test-headless --no-coverage --silent=false --reporter=verbose \
  modules/experimental/test/gpu-project/projection-program-benchmark.spec.ts
```

The opt-in fixtures default to 32 rows; ordinary hardware tests retain the failure-gate and
output-frame regressions. Software adapters skip these integer-fp64 GPU checks.
The benchmark does not automatically select arithmetic or relax application tolerances.

### Multi-patch and consumer-reuse sweeps

An additional opt-in suite compares degree-2 and degree-3 adaptive programs at the **same 1 mm
output error budget**, using double-single arithmetic/output and binary64 input throughout.
Local/regional UTM and regional Albers vary actual patch count; row and consumer sweeps expose
scaling without conflating a Float32 precision reduction with a performance improvement.

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true \
  VITE_LUPROJ_SWEEP_ROWS=1024,16384,65536 VITE_LUPROJ_SWEEP_CONSUMERS=1,4 \
  yarn test-headless --no-coverage --silent=false --reporter=verbose \
  modules/experimental/test/gpu-project/projection-performance.spec.ts
```

Rows are deterministic; each requested count adds nine valid boundary/seam probes and two invalid
rows. Each path is validated before two warmups and after five measured submissions. Without
`VITE_LUPROJ_SWEEP_ROWS`, this opt-in suite uses 32 rows, no warmups, and one measured iteration
for a quick correctness check. Set `VITE_LUPROJ_SWEEP_GPU_TIMING=true` for a **separate** instrumented
run. Reports prefixed `PROJECTION_PERFORMANCE_SWEEP` contain the complete JSON distributions,
device description, patch counts, accuracy and memory results.

Patch lookup currently scans linearly. Changing polynomial degree changes both patch count and
evaluation cost: these measurements do not isolate routing time or prove an indexed lookup wins.
The axis-swap consumers remain synthetic; production consumers and other GPU vendors are still
required before selecting optimizations.

See [WebGPU Geospatial Kernels](/docs/api-reference/experimental/geospatial),
[GPU spatial query benchmarks](/docs/api-reference/experimental/gpu-core/gpu-spatial-query-benchmark),
and [GPU floating-point precision](/docs/api-guide/shaders/gpu-floating-point-precision) for related
GPU execution and precision techniques.
