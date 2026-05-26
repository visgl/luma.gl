# dggs

The `dggs` shader module provides WGSL helpers for compact 64-bit DGGS cell IDs
stored as two `u32` words. It is intended for WebGPU storage-buffer paths that
need to compare, decode, or expand geohash, quadkey, S2, A5, or H3 cell keys
without first materializing CPU polygons.

## Usage

```ts
import {dggs} from '@luma.gl/shadertools';

const modules = [dggs];
```

Arrow `BigUint64Array` storage is little-endian on supported browser and Node
WebGPU runtimes. Convert storage reads before using the canonical DGGS helpers:

```wgsl
let cellKey = dggs_u64_from_little_endian_words(cellKeys[cellIndex]);
```

The module exposes Uint64 word helpers plus encoding-specific boundary and
coordinate helpers used by `@luma.gl/arrow` DGGS preparation. Application code
usually reaches it through `prepareDggsCellKeyGPUVector()` and
`prepareDggsCellPathGPUVector()` rather than calling every WGSL helper directly.

Boundary helpers also expose `*_fp64_split` wrappers that return
`vec4f(longitudeHigh, latitudeHigh, longitudeLow, latitudeLow)`. These wrappers
are layout compatibility helpers only: the DGGS decode math currently still
computes Float32 longitude/latitude values, so the low components are zero until
true higher-precision DGGS decode math is added.

## Remarks

- `dggs` is WGSL-only.
- Canonical DGGS helper word order is `vec2<u32>(high, low)`.
- Arrow Uint64 storage reads should pass through
  `dggs_u64_from_little_endian_words()` before DGGS comparisons or decoders.
- The [Global Grids example](/examples/gpu-tables/arrow-dggs-polygons) shows UTF-8
  DGGS IDs parsed into Uint64 GPU keys and expanded into Float32 cell boundaries.
