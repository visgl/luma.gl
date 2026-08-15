# LuCIM GPU Volume Algorithms

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/WebGPU-required-blueviolet.svg?style=flat-square" alt="WebGPU required" />
  <img src="https://img.shields.io/badge/Experimental-orange.svg?style=flat-square" alt="Experimental" />
</p>

`@luma.gl/experimental/lucim` contributes three-dimensional image-processing algorithms to a
caller-owned [`GPUCommandGraph`](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph).
LuCIM is inspired by [RAPIDS cuCIM](https://docs.rapids.ai/api/cucim/stable/) and its GPU-accelerated
n-dimensional image-processing categories. It is not a JavaScript port or an API-compatibility
layer: cuCIM targets CUDA arrays and a scikit-image-compatible Python surface, while LuCIM targets
portable browser WebGPU, explicit graph resources, and application-owned command submission.

## Implemented tranches

| Tranche | Contract | Implemented algorithms |
| --- | --- | --- |
| 1. Volume foundation and classification | Dense x-fastest buffers, physical spacing/origin/direction, validity, raw nodata, calibration | `GPUVolume`, `GPUVolumeThreshold` |
| 2. Neighborhood morphology | Explicit 3D footprints, borders, nodata policy, graph-owned scratch for composed operations | `GPUVolumeDilation`, `GPUVolumeErosion`, `GPUVolumeOpening`, `GPUVolumeClosing` |
| 3. Segmentation | Deterministic sparse roots, bounded GPU-only stabilization, fail-closed publication | `GPUVolumeConnectedComponents` with 6, 18, or 26 connectivity |
| 4. Region measurements | Fixed-capacity GPU outputs with explicit label overflow | `GPUVolumeRegionMeasurements` voxel counts and index-space bounds |

The tranches compose without intermediate CPU readback. A threshold mask can feed morphology,
morphology can feed connected components, and the sparse component labels can feed measurements in
one compiled graph.

## Data model

`GPUVolume` borrows one or more packed `GPUVolumeBufferChannel` objects. Each channel contains
exactly one scalar `float32`, `uint32`, or `sint32` sample per voxel. Linear storage is x-fastest,
then y, then z:

```text
voxelIndex = (z * height + y) * width + x
```

Optional `validity` flags are independent of sample values: a zero sample can remain valid, while a
zero validity flag rejects the corresponding observation. `noDataValue` is compared in the raw
source type before the optional `sample * scale + offset` calibration. Algorithms never infer
missingness from a calibrated value.

`GPUVolumeMetadata` retains physical `spacing`, `origin`, a row-major 3x3 `direction` matrix, and
whether integer coordinates identify voxel cells or sample points. `GPUVolume` uses JavaScript
double precision for coordinate conversion and physical voxel volume. GPU algorithms use the dense
index grid and never silently resample or reorient it.

## Composing a pipeline

The application creates and imports every persistent input and output. LuCIM contributors declare
the nodes and any bounded transient scratch:

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUVolumeConnectedComponents,
  GPUVolumeDilation,
  GPUVolumeRegionMeasurements,
  GPUVolumeThreshold
} from '@luma.gl/experimental/lucim';

const graph = new GPUCommandGraph(device, {id: 'volume-segmentation'});

new GPUVolumeThreshold({
  width,
  height,
  depth,
  input: densityChannel,
  output: thresholdMask,
  threshold: 0.42
}).addToGraph(graph);

new GPUVolumeDilation({
  mode: 'binary',
  width,
  height,
  depth,
  radius: 1,
  structuringElement: 'ball',
  input: {id: 'threshold', format: 'uint32', values: thresholdMask},
  output: expandedMask,
  outputValidity: expandedValidity
}).addToGraph(graph);

new GPUVolumeConnectedComponents({
  width,
  height,
  depth,
  input: {
    id: 'expanded',
    format: 'uint32',
    values: expandedMask,
    validity: expandedValidity
  },
  output: labels,
  outputValidity: labelValidity,
  converged,
  connectivity: 26
}).addToGraph(graph);

new GPUVolumeRegionMeasurements({
  width,
  height,
  depth,
  labels,
  labelValidity,
  output: {voxelCounts, minimumCoordinates, maximumCoordinates},
  overflow
}).addToGraph(graph);

const compiled = graph.compile();
compiled.encode(commandEncoder, {parameters: undefined});
```

Compilation owns pipelines and transient buffers. The compiled graph borrows imports, records into
the caller's encoder, and does not submit commands or read results back.

## Morphology

Binary morphology canonicalizes nonzero `uint32` input to one. Grayscale morphology converts valid
native samples to calibrated `float32` values before selecting extrema. The footprint families
mirror common volumetric morphology shapes:

- `cube` includes every offset in the bounded radius.
- `octahedron` includes offsets within the Manhattan radius.
- `ball` includes offsets within the Euclidean radius.

Radii are limited to zero through four so the cooperatively loaded value-and-validity tile fits the
portable WebGPU workgroup-storage floor. `clamp`, `reflect`, `constant`, and `nodata` make boundary
behavior explicit. With `noDataPolicy: 'propagate'`, any included missing neighbor invalidates the
result; `ignore` skips missing neighbors but never makes an invalid center valid.

Opening and closing contribute two ordered passes and allocate type-matching graph-owned scratch.
They still borrow their source and final outputs.

## Connected components

`GPUVolumeConnectedComponents` labels nonzero valid voxels using deterministic minimum x-fastest
roots. Label zero remains background or invalid; positive labels are the root voxel index plus one.
The result is intentionally sparse, avoiding an implicit sort, compaction, or readback.

The contributor declares bounded atomic hooking and path-compression rounds. GPU-written indirect
dispatch dimensions suppress later rounds after stabilization. `converged` and optional
`iterationCount` stay GPU-resident. If `maximumIterations` is insufficient, publication fails
closed by clearing every output label and validity flag.

## Region measurements

`GPUVolumeRegionMeasurements` accepts any zero-background one-based label field. Output capacity is
the length of `voxelCounts`; `minimumCoordinates` and `maximumCoordinates` contain one packed
`uint32x3` row per slot. Maximum coordinates are exclusive, so an occupied region's grid extent is
`maximum - minimum`. Empty slots are canonical zero rows.

Sparse connected-component roots can be measured directly by allocating up to the voxel count, or
an application can supply its own dense labels and smaller capacity. A positive label beyond the
capacity sets `overflow` and is not folded into another region.

## Boundaries and next tranches

This first LuCIM slice intentionally does not claim cuCIM feature parity. Candidate later tranches
include separable Gaussian/rank filters, Euclidean distance transforms, watershed and contour
surfaces, multiscale registration, chunked/halo-aware out-of-core volumes, and dense component-label
compaction. Those algorithms require separate numerical, storage, or capacity contracts and are
not hidden inside the implemented operations.

Texture upload, medical-image decoding, chunk scheduling, command submission, synchronization,
and readback remain application responsibilities.
