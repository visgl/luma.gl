# WebGPU Geospatial Kernels

The `@luma.gl/experimental/geospatial` entry point provides small, side-effect-free WebGPU algorithms that add compute nodes to a `GPUCommandGraph`. This first set includes fixed-output projection and distance kernels plus a flat grid index and point-query workflow:

* `GPUSinusoidalProjection`
* `GPUHaversineDistance`
* `GPUPairwisePointDistance`
* `GPUPairwisePointSegmentDistance`
* `GPUPairwisePointInPolygon`
* `GPUPairwisePointLinestringNearest`
* `GPUGridIndex`
* `GPUPointSpatialQuery`

These classes structurally implement `GPUCommandGraphContributor`. Calling `addToGraph()` declares work, but does not compile the graph, submit commands, allocate caller-visible outputs, or read results back. Projection and simple pairwise distance kernels accept caller-allocated `GraphDataView` objects or matching `GraphVectorView` objects. The nested-offset point-in-polygon and nearest-linestring APIs, grid index, and point query consume fixed-width flat `GraphDataView` objects in V1.

```
import {GPUCommandGraph} from '@luma.gl/experimental';

import {GPUHaversineDistance} from '@luma.gl/experimental/geospatial';



const graph = new GPUCommandGraph(device);



new GPUHaversineDistance({

  left: pickupLocations,

  right: dropoffLocations,

  output: distances

}).addToGraph(graph);



const compiled = graph.compile();
```

The geospatial entry point is intentionally separate from the experimental root and standalone bundle. Importing the subpath is the explicit opt-in.

## Coordinate and result formats[​](#coordinate-and-result-formats "Direct link to Coordinate and result formats")

Two packed position formats are accepted:

| Position format | Storage                                                        | Intended use                                    |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `float32x2`     | Local XY or longitude/latitude values                          | Fast, tile-local calculations                   |
| `uint32x4`      | Raw browser `Float64Array` words: `[xLow, xHigh, yLow, yHigh]` | Preserve small deltas between large coordinates |

Projection and haversine outputs are `float32x2` and `float32`, respectively. Their trigonometric steps are f32 because portable WGSL does not provide f64 trigonometry.

Planar distance kernels pair their input and output formats:

| Position input          | Distance output                          |
| ----------------------- | ---------------------------------------- |
| `float32x2`             | `float32`                                |
| raw binary64 `uint32x4` | double-single `float32x2` (`high + low`) |

The TypeScript property unions enforce these pairs. Raw binary64 subtraction occurs before the planar calculation, preventing nearby large coordinates from first collapsing to the same f32 value. Double-single results provide approximately 48 significand bits over the f32 exponent range; they are not general IEEE binary64 values.

Projection and simple pairwise distance inputs and outputs must have the same row count and view kind. Vector inputs must also have identical chunk topology. Empty chunks are retained without dispatching work. Nested geometry offsets cannot safely span independently chunked vectors, so the two pairwise geometry APIs intentionally accept flat data views only. Each output must use storage separate from its inputs, and view byte offsets must be naturally aligned to the row format.

## `GPUSinusoidalProjection`[​](#gpusinusoidalprojection "Direct link to gpusinusoidalprojection")

`GPUSinusoidalProjection` matches the cuSpatial longitude/latitude convention. Coordinates and the origin are in degrees; output is in kilometres. For longitude `lon`, latitude `lat`, and `origin = [originLon, originLat]`, it computes:

```
kilometresPerDegree = 40000 / 360

x = (originLon - lon) * kilometresPerDegree * cos((lat + originLat) / 2)

y = (originLat - lat) * kilometresPerDegree
```

The cosine argument is converted to radians. The sign, fixed 40,000 km circumference, and mean latitude are part of the compatibility contract. Longitude is not implicitly wrapped at the antimeridian. `originLon` must be in `[-180, 180]`, `originLat` must be in `[-90, 90]`, and both values must be finite.

Raw binary64 inputs preserve each origin-minus-coordinate delta through binary64 subtraction before rounding that delta to f32. The absolute latitude used to evaluate the midpoint cosine and the remaining arithmetic are f32. This kernel does not claim f64-transcendental accuracy.

## `GPUHaversineDistance`[​](#gpuhaversinedistance "Direct link to gpuhaversinedistance")

`GPUHaversineDistance` calculates pairwise great-circle distance from longitude/latitude degrees. The configurable positive `radius` defaults to `6371` km and must be finite and representable as a finite f32 value.

For angular deltas below `1e-4` radians, the implementation uses the local equirectangular limit so that adapters do not collapse tiny f32 trigonometric inputs to zero. Intermediate paths use the standard clamped `asin(sqrt(h))` haversine form. Paths beyond a central angle of π/2 use independent spherical cross and dot products with `atan2`, avoiding the sensitivity of a rounded haversine near antipodes. The acceptance suite requires at most 2 km absolute error against a double-precision CPU oracle for difficult finite paths, including antimeridian, near-polar, and nearly antipodal cases. This is a practical V1 error envelope rather than a cross-adapter mathematical bound; applications needing tighter geodesic guarantees should verify their target devices and coordinate domain.

Raw binary64 inputs avoid premature CPU conversion and preserve small longitude/latitude deltas through subtraction, but the transcendental inputs and final scalar result remain f32.

## `GPUPairwisePointDistance`[​](#gpupairwisepointdistance "Direct link to gpupairwisepointdistance")

`GPUPairwisePointDistance` calculates the Euclidean distance between aligned point rows. Local f32 inputs write one f32 distance per row. Raw binary64 inputs write a double-single result as `[high, low]`; add the two limbs when reading the result on the CPU.

## `GPUPairwisePointSegmentDistance`[​](#gpupairwisepointsegmentdistance "Direct link to gpupairwisepointsegmentdistance")

`GPUPairwisePointSegmentDistance` calculates the Euclidean distance from each point to its aligned closed segment. Projections before the start or after the end are clamped to the corresponding endpoint. A degenerate segment returns the point-to-endpoint distance. Its f32 and raw binary64 input/output pairings are the same as `GPUPairwisePointDistance`.

## `GPUPairwisePointInPolygon`[​](#gpupairwisepointinpolygon "Direct link to gpupairwisepointinpolygon")

`GPUPairwisePointInPolygon` classifies one point against one polygon or multipolygon per row. It accepts flat point and vertex views plus three caller-owned `uint32` offset views:

* `geometryOffsets` maps each point row to a range of polygons;
* `polygonOffsets` maps each polygon to a range of rings; and
* `ringOffsets` maps each ring to a range of flattened polygon positions.

Each offsets view starts at zero and ends at the next hierarchy level's row count. Offsets must be nondecreasing. Rings close implicitly, use even/odd fill semantics, and may repeat their first vertex explicitly. Polygon components within a multipolygon are unioned. Empty geometries are outside, while malformed reachable spans and rings with fewer than three effective vertices are uncertain. Rings whose effective vertices do not contain a provably non-collinear triple are also uncertain, including rings with three or more distinct vertices on one line.

The caller-owned `uint32` output uses these values:

| Value | Classification |
| ----- | -------------- |
| `0`   | `outside`      |
| `1`   | `inside`       |
| `2`   | `boundary`     |
| `3`   | `uncertain`    |

Applications must handle `uncertain` explicitly. Non-finite coordinates and predicates too close to the double-single arithmetic error envelope are never silently forced to inside or outside. For both f32 and raw binary64 positions, exact endpoints and axis-aligned boundaries can be proven as boundary; an exactly zero non-axis-aligned determinant remains uncertain without an adaptive exact predicate. A cuSpatial-compatible boolean projection is `classification === GPU_POINT_IN_POLYGON_CLASSIFICATION.inside`, so boundary remains false.

## `GPUPairwisePointLinestringNearest`[​](#gpupairwisepointlinestringnearest "Direct link to gpupairwisepointlinestringnearest")

`GPUPairwisePointLinestringNearest` finds the nearest point on one paired multipart linestring for each input point. `geometryOffsets` maps each point row to linestring parts, and `linestringOffsets` maps each part to flattened positions. Parts are never joined or closed implicitly. Empty and singleton parts contain no segment; repeated-vertex segments remain valid distance candidates. Equal-distance ties preserve the first part and segment.

Both offset views start at zero, are nondecreasing, and end at the next level's row count. Malformed reachable spans invalidate the complete paired row rather than being clamped into a different geometry.

The required `output` follows the planar distance format pairing: f32 inputs write `float32`, while raw binary64 inputs write double-single `float32x2`. Optional outputs include the nearest point, the local linestring-part index, and the local segment index. F32 nearest points use `float32x2`; raw binary64 nearest points use absolute `[xHigh, xLow, yHigh, yLow]` `float32x4` rows. When no finite segment remains, numeric outputs are NaN and indices are `0xffffffff`.

Every output view must have a disjoint aligned storage-binding footprint from every input and from the other optional outputs. This also applies when distinct graph handles refer to the same physical buffer.

Both pairwise geometry kernels currently assign one GPU invocation to each row and scan that row's rings or segments serially. This keeps the first API and storage contract small and works well for bounded per-row geometries. Very large individual geometries should use a future flattened-segment and segmented-reduction path.

## `GPUGridIndex`[​](#gpugridindex "Direct link to gpugridindex")

`GPUGridIndex` rebuilds a flat, row-major uniform grid for packed `float32x2` or `float32x3` points each time the compiled build graph is encoded. Its caller-owned outputs are:

* `cellOffsets`: `cellCount + 1` exclusive offsets;
* `objectIds`: capacity-bounded source IDs grouped by cell;
* `count`: the number of finite, in-domain positions accepted by the build; and
* `overflow`: `1` when `count` exceeds `objectIds.length`, otherwise `0`.

The `bounds` array stores every minimum followed by every maximum: `[minX, minY, maxX, maxY]` in 2D or `[minX, minY, minZ, maxX, maxY, maxZ]` in 3D. Positions outside these inclusive bounds and positions with non-finite components are ignored. Supply `sourceIds` to retain application IDs, or use `firstSourceIndex` to generate consecutive IDs. IDs within a cell have unspecified order.

Index construction is intended for a separate graph that runs when a dataset or tile changes. The compact cell offsets require a complete rebuild after point positions or membership change.

## `GPUPointSpatialQuery`[​](#gpupointspatialquery "Direct link to gpupointspatialquery")

`GPUPointSpatialQuery` selects rows from packed `float32x2` or `float32x3` positions. It accepts a mutable f32 `query` view with one of these layouts:

| Kind      | 2D layout                                  | 3D layout                              |
| --------- | ------------------------------------------ | -------------------------------------- |
| `bounds`  | `[minX, minY, maxX, maxY]`                 | `[minX, minY, minZ, maxX, maxY, maxZ]` |
| `radius`  | `[centerX, centerY, radius]`               | `[centerX, centerY, centerZ, radius]`  |
| `polygon` | Polygon bounds: `[minX, minY, maxX, maxY]` | Not supported                          |

An optional `GPUGridIndex` view restricts refinement to cells intersecting the query envelope. The query prepares an indirect dispatch on the GPU and refines only those candidates. Without an index, it scans every position. The query-facing index view exposes `rowIndices`, and every stored value must address a row in the supplied `positions` view. A `GPUGridIndex` can produce this buffer by using its default zero-based generated IDs and passing its `objectIds` output as query `rowIndices`. Keep application IDs out of that index build; instead, provide them through the query's optional packed `sourceIds` view, aligned one-to-one with `positions`. Matching outputs use `sourceIds[rowIndex]` when supplied and the zero-based row index otherwise. `GPUGridIndex` itself remains a generic index and can still store arbitrary IDs for other consumers.

Polygon positions use packed `float32x2` rows. `ringOffsets` contains a start offset for each ring plus one terminal offset; rings close implicitly and use even/odd fill semantics. Boundary points are selected. This V1 API returns matching IDs rather than robust-topology classifications, so it does not distinguish `inside`, `boundary`, or an ambiguous result.

All query outputs are caller-owned:

```
type GPUSpatialQueryOutput = {

  ids: GraphDataView<'uint32'>;

  count: GraphDataView<'uint32'>;

  overflow: GraphDataView<'uint32'>;

  totalCount?: GraphDataView<'uint32'>;

};
```

`count` is clamped to `ids.length` and can alias an indirect draw count. `totalCount`, when provided, receives the unclamped number of matches among candidates actually examined by refinement. If the index overflowed, its stored candidates are only a subset of the accepted source rows, so `totalCount` is incomplete relative to the original positions. `overflow` is set when either the index or result capacity overflows. The four writable output views must have mutually disjoint aligned storage-binding ranges and must not overlap positions, source IDs, query values, index storage, or polygon storage. This includes the one-row binding footprint of a zero-capacity `ids` view. Result order is unspecified; no CPU readback is required for rendering.

## Non-finite data[​](#non-finite-data "Direct link to Non-finite data")

The fixed-output distance and projection kernels do not silently replace non-finite arithmetic with finite coordinates or distances. Grid construction ignores non-finite positions, and point queries do not select them. Applications should still filter or classify non-finite rows before rendering or consuming fixed-output results.

## Scale and dispatch[​](#scale-and-dispatch "Direct link to Scale and dispatch")

Fixed-output kernels linearize bounded multidimensional WebGPU workgroup dispatches. This avoids the usual 65,535-workgroup single-dimension ceiling (16,776,960 rows at a workgroup size of 256) without allocating or packing a source-sized intermediate. For vector-capable kernels, each chunk remains an independent graph node, so large streamed vectors retain their original topology. Nested-geometry kernels dispatch their flat paired rows directly. Indexed point queries instead generate their candidate dispatch dimensions on the GPU.

## See also[​](#see-also "Direct link to See also")

* [GPUCommandGraph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)
* [GPUGridIndex](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)
* [GPU floating-point precision](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)
* [`fp64arithmetic`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md)
