# @luma.gl/gpgpu

General-purpose GPU data and computation for luma.gl.

The stable package root provides the existing portable GPGPU evaluators. Version 9.4 also exposes
an experimental data subpath that is not re-exported from the root:

- `@luma.gl/gpgpu/gpu-data` for `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, memory formats,
  and basic buffer/layout helpers.

These experimental subpaths have no 9.4 semver compatibility promise. Higher-level record batches,
tables, schemas, bindings, and table planners live in `@luma.gl/experimental/gpu-tables`; path and
polygon rendering models live in `@luma.gl/experimental/models`.

See [luma.gl](https://luma.gl) for documentation.
