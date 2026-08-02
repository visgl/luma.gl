# WebGPU Geospatial Kernels

The `@luma.gl/experimental/geospatial` entry point provides small, side-effect-free WebGPU
algorithms that add compute nodes to a `GPUCommandGraph`. The first set covers longitude/latitude
projection and distance calculations:

- `GPUSinusoidalProjection`
- `GPUHaversineDistance`
- `GPUPairwisePointDistance`
- `GPUPairwisePointSegmentDistance`

These classes implement `GPUCommandGraphContributor`. Calling `addToGraph()` declares work, but
does not compile the graph, submit commands, allocate caller-visible outputs, or read results back.
Inputs and outputs are caller-allocated `GraphDataView`s or matching `GraphVectorView`s.

```ts
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

The geospatial entry point is intentionally separate from the experimental root and standalone
bundle. Importing it is the explicit opt-in.

## Coordinate and result formats

Two packed position formats are accepted:

| Position format | Storage | Intended use |
| --- | --- | --- |
| `float32x2` | Local XY or longitude/latitude values | Fast, tile-local calculations |
| `uint32x4` | Raw browser `Float64Array` words: `[xLow, xHigh, yLow, yHigh]` | Preserve small deltas between large coordinates |

Projection and haversine outputs are `float32x2` and `float32`, respectively. Their trigonometric
steps are f32 because WGSL does not provide portable f64 trigonometry.

Planar distance kernels pair their input and output formats:

| Position input | Distance output |
| --- | --- |
| `float32x2` | `float32` |
| raw binary64 `uint32x4` | double-single `float32x2` (`high + low`) |

The TypeScript property unions enforce these pairs. Raw binary64 subtraction occurs before the
planar calculation, preventing nearby large coordinates from first collapsing to the same f32
value. Double-single results provide approximately 48 significand bits over the f32 exponent
range; they are not general IEEE binary64 values.

All paired inputs and outputs must have the same row count and view kind. Vector inputs must also
have identical chunk topology. Empty chunks are retained without dispatching work. Each output
must use storage separate from its inputs, and view byte offsets must be naturally aligned to the
row format.

## `GPUSinusoidalProjection`

`GPUSinusoidalProjection` matches the cuSpatial longitude/latitude convention. Coordinates and the
origin are in degrees; output is in kilometres. For longitude `lon`, latitude `lat`, and
`origin = [originLon, originLat]`, it computes:

```text
kilometresPerDegree = 40000 / 360
x = (originLon - lon) * kilometresPerDegree * cos((lat + originLat) / 2)
y = (originLat - lat) * kilometresPerDegree
```

The cosine argument is converted to radians. The sign, fixed 40,000 km circumference, and mean
latitude are part of the compatibility contract. Longitude is not implicitly wrapped at the
antimeridian. `originLon` must be in `[-180, 180]`, `originLat` must be in `[-90, 90]`, and both
values must be finite.

Raw binary64 inputs preserve each origin-minus-coordinate delta through binary64 subtraction before
rounding that delta to f32. The absolute latitude used to evaluate the midpoint cosine and the
remaining arithmetic are f32. This kernel does not claim f64-transcendental accuracy.

## `GPUHaversineDistance`

`GPUHaversineDistance` calculates pairwise great-circle distance from longitude/latitude degrees.
The configurable positive `radius` defaults to `6371` km and must be finite and representable as a
finite f32 value.

The implementation uses the standard clamped `asin(sqrt(h))` haversine form through a central
angle of π/2. Longer paths use independent spherical cross and dot products with `atan2`, avoiding
the sensitivity of a rounded haversine near antipodes. The acceptance suite requires at most 2 km
absolute error against a double-precision CPU oracle for difficult finite paths, including
antimeridian, near-polar, and nearly antipodal cases. This is a practical V1 error envelope rather
than a cross-adapter mathematical bound; applications needing tighter geodesic guarantees should
verify their target devices and coordinate domain.

Raw binary64 inputs avoid premature CPU conversion and preserve small longitude/latitude deltas
through subtraction, but the transcendental inputs and final scalar result remain f32.

## `GPUPairwisePointDistance`

`GPUPairwisePointDistance` calculates the Euclidean distance between aligned point rows. Local
f32 inputs write one f32 distance per row. Raw binary64 inputs write a double-single result as
`[high, low]`; add the two limbs when reading the result on the CPU.

## `GPUPairwisePointSegmentDistance`

`GPUPairwisePointSegmentDistance` calculates the Euclidean distance from each point to its aligned
closed segment. Projections before the start or after the end are clamped to the corresponding
endpoint. A degenerate segment returns the point-to-endpoint distance. Its f32 and raw binary64
input/output pairings are the same as `GPUPairwisePointDistance`.

## Non-finite data

The fixed-output distance and projection kernels do not silently replace non-finite arithmetic
with finite coordinates or distances. Applications should filter or classify non-finite rows
before rendering or consuming results. Robust topology predicates use a stricter explicit
classification contract and are outside this initial projection-and-distance entry point.

## Scale and dispatch

Kernels linearize bounded multidimensional WebGPU workgroup dispatches. This avoids the usual
65,535-workgroup single-dimension ceiling (16,776,960 rows at a workgroup size of 256) without
allocating or packing a source-sized intermediate. Each chunk remains an independent graph node,
so large streamed vectors retain their original topology.

## See also

- [GPUCommandGraph](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph)
- [GPU floating-point precision](/docs/api-guide/shaders/gpu-floating-point-precision)
- [`fp64arithmetic`](/docs/api-reference/shadertools/shader-modules/fp64-arithmetic)
