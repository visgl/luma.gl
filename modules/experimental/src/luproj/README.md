# @luma.gl/experimental/luproj

High-precision, GPU-resident coordinate reprojection for WebGPU command graphs.

`luproj` separates projection semantics from projection execution. An application
supplies any CPU projection provider, including `Proj4Projection` from
`@math.gl/proj4`. The CPU samples that provider using JavaScript Float64
arithmetic and compiles adaptive local polynomial patches. A `GPUProjection`
contributor evaluates those patches over GPU-resident coordinates using fast
Float32 operations and origin-relative precision.

This supports projection families understood by the provider without separately
implementing every projection, datum, or coordinate reference system in WGSL.

## Compile and execute a projection

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUProjection,
  compileProjectionPlan
} from '@luma.gl/experimental/luproj';
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

`bounds` are `[minimumX, minimumY, maximumX, maximumY]` in the source
coordinate system. `tolerance` is expressed in the destination coordinate
system's units; when the destination is a meter-based CRS, `0.01` requests a
sampled error of at most one centimeter.

Projection definitions and datum support remain the provider's responsibility.
`@math.gl/proj4` is optional and is not a dependency of `@luma.gl/experimental`.
A provider can instead be any object exposing `project(coordinates)` or a
standalone projection function.

For the common WGS84-to-Web-Mercator case, `luproj` also includes a
zero-dependency provider with forward projection, inverse projection, and
standard EPSG:3857 polar clamping:

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
import {findProjectionPatch} from '@luma.gl/experimental/luproj';

const patchId = findProjectionPatch(plan, sourceCoordinate);

new GPUProjection({
  positions: sourcePositions,
  output: projectedPositions,
  patchIds: sourcePatchIds,
  plan
}).addToGraph(graph);
```

`findProjectionPatch` returns `-1` outside the compiled bounds. For CPU-side
verification or picking, `evaluateProjectionPlan(plan, coordinate, patchId?)`
returns an absolute destination coordinate rather than a GPU-local offset.

Non-finite input coordinates, rows outside the compiled source bounds, invalid
patch IDs, and patch IDs that do not cover their assigned row produce a
deterministic GPU output of `[0, 0]`. A valid row can also project to the local
origin, so validate inputs separately when that distinction matters.

Graph vector inputs preserve their ordered source chunks, including empty
chunks. Source positions, optional patch IDs, and output positions must share
the same row and chunk topology; `luproj` never concatenates or implicitly
repacks application-owned vectors.

`GPUProjection.updatePlan(nextPlan)` updates an equally sized packed plan
without recompiling the surrounding command graph. Call
`GPUProjection.destroy()` when the contributor is no longer needed; only its
privately allocated plan storage is destroyed, never caller-owned source,
destination, or explicitly supplied `planBuffer` storage.

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
