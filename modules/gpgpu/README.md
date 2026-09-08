# @luma.gl/gpgpu

General-purpose GPU data and computation for luma.gl.

The stable package root provides the existing portable GPGPU evaluators. Version 9.4 also exposes
explicitly experimental subpaths that are not re-exported from the root:

- `@luma.gl/gpgpu/gpu-data` for `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, memory formats,
  and basic buffer/layout helpers;
- `@luma.gl/gpgpu/gpu-core` for WebGPU command graphs, execution planning, inspection, autotuning,
  and generic algorithms;
- `@luma.gl/gpgpu/gpu-graph` for graph data structures, topology, analytics, and layouts, plus the
  optional `@luma.gl/gpgpu/gpu-graph/benchmarks` entry point;
- `@luma.gl/gpgpu/gpu-dggs` for the shared split-uint64 cell projection primitive, plus the optional
  `@luma.gl/gpgpu/gpu-dggs/benchmarks` entry point;
- `@luma.gl/gpgpu/gpu-h3` for GPU-native H3 cell-center decoding; and
- `@luma.gl/gpgpu/gpu-a5` for the corresponding A5 cell-center projection API.

These experimental subpaths have no 9.4 semver compatibility promise. Higher-level record batches,
tables, schemas, bindings, and table planners live in `@luma.gl/experimental/gpu-tables`; path and
polygon rendering models live in `@luma.gl/experimental/models`.

For 9.4, command graphs still use engine abstractions including `Computation` and `DynamicBuffer`.
The intended v10 architecture extracts a generic compute runtime beneath engine, removes direct
engine dependencies from graph scheduling, and layers engine resource and model adapters above
`@luma.gl/gpgpu`.

See [luma.gl](https://luma.gl) for documentation.
