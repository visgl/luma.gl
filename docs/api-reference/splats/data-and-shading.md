---
title: Gaussian splat data and shading
description: Source columns, covariance projection, spherical harmonics, semantic filtering, and updates.
---

import {SplatsDocsTabs} from '@site/src/components/docs/splats-docs-tabs';

# Gaussian splat data and shading

<SplatsDocsTabs active="data-shading" />

## Source columns and rendering

`SplatSource` contains framework-independent, decoded typed arrays. Positions and linear
one-standard-deviation scales are packed XYZ `Float32Array` values; rotations are packed
`[w, x, y, z]` quaternions; colors are normalized RGBA `Uint8Array` values or linear RGBA
`Float32Array` values; and opacities are linear `Float32Array` values. Floating-point colors
preserve high-dynamic-range spherical-harmonic DC radiance, including values above one and below
zero, until rendering. Prepared GPU columns use the `float32x3`, `float32x4`, `unorm8x4`, and
`float32` memory formats provided by [`@luma.gl/tables`](/docs/api-reference/tables).

`SplatRenderer` supports `none`, `global`, and `tile` depth-ordering modes alongside camera matrix,
viewport, radius, opacity, and visibility controls; `GPUSplatGraphRenderer` always uses global
GPU ordering. WebGPU uses GPU-ready splat buffers and WGSL; WebGL2 uses an attribute-backed GLSL
fallback. Both renderers support higher-order directional radiance, semantic filtering, dedicated
GPU picking, and mixed mesh composition through their corresponding interaction helpers. When
globally sorted source batches are densely interleaved, `SplatRenderer` bounds draw-call growth by
grouping rows into depth-ordered batch runs without changing or repacking their source buffers.

The `exposure` property scales linear color before display mapping. Floating-point source colors
automatically enable Reinhard highlight compression on standard dynamic range targets; set
`toneMapping` to `'none'` or `'reinhard'` to override the automatic choice. On a WebGPU canvas
configured with `rgba16float` and extended tone mapping, the renderer preserves unclamped positive
radiance for the presentation target instead of applying SDR highlight compression.

## Higher-order spherical harmonics

Supply `sphericalHarmonics` as a row-major `Float32Array` containing non-DC coefficients in
basis-major RGB triplets. Degrees one, two, and three require 9, 24, and 45 scalar coefficients
per source row. Set `sphericalHarmonicsDegree` explicitly or let preparation infer it from the
coefficient count. The existing color column contains the already reconstructed DC radiance.

```ts
const prepared = makeGPUSplatData(device, {
  positions,
  scales,
  rotations,
  colors,
  opacities,
  sphericalHarmonics: new Float32Array(rowCount * 24),
  sphericalHarmonicsDegree: 2
});

const renderer = new SplatRenderer(device, {
  data: prepared,
  cameraPosition: [cameraX, cameraY, cameraZ],
  sphericalHarmonicsDegree: 2
});
```

WebGPU evaluates the directional coefficients directly from source-owned storage buffers in either
the standard renderer or the reusable graph feature pass. The WebGL2 fallback evaluates
directional radiance into a renderer-owned color buffer without changing the original source
colors. Changing `cameraPosition` refreshes directional colors independently from source ownership.

## Semantic filtering and dynamic updates

Provide `semanticIds: Uint32Array` with one compact class identifier per source row. Configure
`semanticFilter` with included or excluded IDs, an `includeUnlabeled` policy, or a predicate that
receives the stable global row and source-batch identity. Arrow semantic columns must contain
finite unsigned 32-bit integer identifiers; nulls, string labels, fractions, and out-of-range
values are rejected. Omit the column entirely for an unlabeled source batch.

```ts
renderer.setProps({
  semanticFilter: {
    include: [3, 7],
    exclude: [11],
    predicate: (semanticId, rowIndex, sourceBatchIndex) => rowIndex !== hiddenRow
  }
});

prepared.updateRows(12, {
  positions: new Float32Array([nextX, nextY, nextZ]),
  semanticIds: new Uint32Array([7]),
  opacities: new Float32Array([0.9])
});
```

Updates preserve buffer identities, source-batch boundaries, and stable row indices. Borrowing
renderers detect the prepared batch's `revision` and refresh visibility, sorting, semantic masks,
or directional colors as needed.

## Related pages

- [Gaussian splats overview](/docs/api-reference/splats)
- [Gaussian splat showcase](/examples/showcase/gaussian-splats)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
