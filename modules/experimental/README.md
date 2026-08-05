# @luma.gl/experimental

Experimental features for luma.gl.

:::warning
These are experimental features that may change or be removed at any time. Use at your own risk.
:::

The package currently includes experimental GPU command graphs and data-parallel primitives such
as scan, compaction, stable key/value sort, two-dimensional FFT, and spectral ocean simulation,
order-independent transparency renderers, composable cross-backend glass and reflective-material
shader modules, packed pixel-format helpers, and v10 work-in-progress WebGPU/WebGL WebXR session
and frame helpers, with WebGL-only raw camera textures. See the
[luma.gl API reference](https://luma.gl/docs/api-reference/experimental) for documentation.

Optional algorithm entry points keep specialized workflows out of the default experimental bundle:

- `@luma.gl/experimental/geospatial` provides graph-native spatial operations and distance kernels.
- `@luma.gl/experimental/luproj` compiles arbitrary CPU coordinate transformations into
  precision-preserving, GPU-evaluated local projection patches.
- `@luma.gl/experimental/lutrace` keeps execution-trace scenes, process/thread interactions,
  dependency focus, and timeline picking separate from generic command-graph primitives.
