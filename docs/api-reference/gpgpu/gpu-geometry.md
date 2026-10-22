# GPU Geometry

`@luma.gl/gpu-graph/gpu-geometry` provides experimental WebGPU mesh operations that compose in a
caller-owned `GPUCommandGraph`. These are computation operations, independent of engine `Geometry`.

| Operation | Inputs | Output | Cost |
| --- | --- | --- | --- |
| `GPUMeshNormals` | Packed positions and triangle-list indices | One face normal per triangle | O(triangles) |
| `GPUMeshVertexNormals` | Face normals and CSR vertex-to-face incidence | One unit normal per vertex | O(vertices + incidences) |
| `GPUMeshSmoothing` | Positions and CSR vertex-neighbor adjacency | One updated position per vertex | O(vertices + adjacency entries) |

## Compose smoothing and normals

```ts
import {GPUMeshNormals, GPUMeshVertexNormals, GPUMeshSmoothing} from '@luma.gl/gpu-graph/gpu-geometry';

// All arguments below are GraphDataViews registered with the same graph.
graph.add(new GPUMeshSmoothing({
  positions, output: smoothedPositions, offsets: neighborOffsets, neighbors,
  pinned, factor: 0.5
}));
graph.add(new GPUMeshNormals({
  positions: smoothedPositions, indices, normals: faceNormals, areaWeighted: true
}));
graph.add(new GPUMeshVertexNormals({
  faceNormals, offsets: incidenceOffsets, faceIndices, normals: vertexNormals
}));
const compiled = graph.compile();
// Encode and submit with the application's command encoder; bind outputs to a renderer directly.
```

## Data and ownership

Positions and normals are packed `GraphDataView<'float32x3'>`; indices, offsets, adjacency and pin
flags are packed `GraphDataView<'uint32'>`. Nonzero byte offsets are supported. Every operation
borrows its inputs and outputs. Output buffers must be separate from input buffers. Multiple writable output bindings must also
remain disjoint after their start offsets are rounded down to 256-byte alignment. Operations do
not submit work, read results back, or destroy caller buffers. Destroy the compiled graph to release
its kernels, and separately destroy your buffers.

CSR offsets have `vertexCount + 1` rows, start at zero, are monotonic, and end at the entry count.
Adjacency should contain each neighbor once. Incidence should contain each incident face once.
Prepare topology explicitly when loading a mesh; this version does not construct it automatically.
No implicit packing or cross-batch topology reconciliation occurs. These initial APIs accept one
resident packed view per attribute; partitioning and stitching are caller responsibilities.

Source `POSITION` and `NORMAL` attribute names remain unchanged in CPU geometry containers. Map
them to shader attributes only when creating renderer bindings.

## Numerical behavior and limits

- Triangle winding determines the normal direction. Default face normals have unit length;
  `areaWeighted: true` returns the unnormalized cross product (twice oriented triangle area).
- Degenerate faces and faces with out-of-range vertex IDs produce zero. Supply finite positions
  in a scale where cross products do not overflow float32.
- Vertex normals normalize the sum of incident faces. Isolated vertices and cancelling sums
  produce zero. Out-of-range face references are ignored.
- Smoothing performs one simultaneous Jacobi iteration toward the neighbor mean, with factor
  in `[0, 1]`. Nonzero pin flags preserve boundaries or constrained vertices. Isolated vertices
  remain unchanged; self-neighbors and out-of-range neighbor IDs are ignored.
- Compose explicit ping-pong buffers for multiple iterations. Uniform Laplacian smoothing shrinks
  surfaces and does not guarantee volume preservation or protect sharp features.
- CSR payloads are a caller contract, not validated through CPU readback. Shaders clamp traversal
  to the entry capacity, but malformed topology has no meaningful geometric interpretation.
- Each bound view must fit the device's storage-binding limit. WebGPU is required.

[Run the surface lab](/examples/experimental/gpu-geometry) to compare a noisy mesh with its smoothed,
GPU-normalized result. The initial scope does not include surface extraction, mesh simplification,
registration, or topology generation.
