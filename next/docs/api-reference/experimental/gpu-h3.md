# GPU H3

[Projection](https://luma.gl/next/docs/api-reference/experimental/gpu-project.md)[Geospatial Kernels](https://luma.gl/next/docs/api-reference/experimental/geospatial.md)[DGGS](https://luma.gl/next/docs/api-reference/experimental/gpu-dggs.md)[H3](https://luma.gl/next/docs/api-reference/experimental/gpu-h3.md)[A5](https://luma.gl/next/docs/api-reference/experimental/gpu-a5.md)

`@luma.gl/gpgpu/gpu-h3` decodes GPU-resident H3 cell indexes into center coordinates. It covers every H3 resolution, pentagon topology, and face transition while retaining one output row per input cell.

```
import {GPUH3CellProjection} from '@luma.gl/gpgpu/gpu-h3';



new GPUH3CellProjection({

  cells,

  output: unitVectors,

  validity,

  projection: 'unit-vector'

}).addToGraph(graph);
```

The operation is the H3-typed adapter over the shared [`GPUDGGSCellProjection`](https://luma.gl/next/docs/api-reference/experimental/gpu-dggs.md) primitive. It adds no family-specific JavaScript overhead.

## Try it on this device[​](#try-it-on-this-device "Direct link to Try it on this device")

Choose **H3** in the benchmark below. The six repeated source cells span both hemispheres and a wide longitude range; larger row counts expose steady-state throughput without requiring a large network download.

### Live DGGS cell-center projection

Decode a repeated, globally distributed set of valid H3 or A5 indexes with the public command-graph primitive. Correctness checks, upload, compilation, and readback stay outside measured submissions.

Ready to decode **262,144** <!-- -->H3<!-- --> indexes into **normalized vectors**.

GridH3 (h3)OutputUnit vector (unit-vector)Cells262,144 (262144)

Run cell projection benchmark

## What happens per cell[​](#what-happens-per-cell "Direct link to What happens per cell")

1. Validate the split-64-bit H3 mode, resolution, base cell, and digit sequence.
2. Rotate and descend the aperture-7 hierarchy, including Class II/Class III orientation.
3. Apply pentagon deleted-subsequence rules and leading-digit correction.
4. Resolve FaceIJK overage across icosahedron faces.
5. Write either spherical longitude/latitude or an Earth-centered unit vector.

Integer index logic remains exact in WGSL `u32` operations. The final spherical coordinates use portable `f32` arithmetic.

## Choosing an output[​](#choosing-an-output "Direct link to Choosing an output")

| Need                                    | Projection      | Output      | Notes                                           |
| --------------------------------------- | --------------- | ----------- | ----------------------------------------------- |
| Globe vertices, angular tests, lighting | `'unit-vector'` | `float32x3` | Lower-transcendental path; naturally normalized |
| Labels, tooltips, CPU interoperability  | `'lnglat'`      | `float32x2` | Longitude then latitude in degrees              |

The unit-vector path uses precomputed per-face tangent bases and gnomonic normalization. Its fixed table is small enough to remain a module-scope shader constant; callers do not manage a table buffer or extra binding.

## Preparing H3 indexes[​](#preparing-h3-indexes "Direct link to Preparing H3 indexes")

For native little-endian 64-bit storage, a zero-copy word view is sufficient:

```
const h3Indexes = BigUint64Array.from(h3Strings, value => BigInt(`0x${value}`));

const cellWords = new Uint32Array(h3Indexes.buffer);
```

Upload `cellWords`, import the buffer into a `GPUCommandGraph`, and create a packed `uint32x2` data view. If a data source already stores the high word first, pass `wordOrder: 'high-low'` rather than repacking it.

note

**Precision and exact cell encoding.**

Index validation and topology traversal are integer operations. Center projection ends in `f32`, so longitude/latitude is intended for visualization and massively parallel analysis rather than bit-for-bit reproduction of a CPU `f64` implementation.

The inverse operation—latitude/longitude to H3 cell—is more sensitive. At high resolutions, an `f32` coordinate near an edge can select a neighbor. A realistic encoder should generate candidates on the GPU and send only boundary-ambiguous rows through an exact CPU verification step.

## Correctness envelope[​](#correctness-envelope "Direct link to Correctness envelope")

The browser test suite compares the GPU path with `h3-js` across:

* all resolutions from 0 through 15;
* every resolution-zero base cell;
* globally distributed latitude/longitude samples;
* neighborhoods around every pentagon at representative resolutions;
* longitude/latitude and unit-vector output;
* malformed and reserved split-64-bit indexes.

## Next reusable H3 primitives[​](#next-reusable-h3-primitives "Direct link to Next reusable H3 primitives")

The center decoder already supplies the hard pieces future operations need: split-64-bit helpers, index validation, hierarchy rotations, pentagon handling, FaceIJK conversion, bounded dispatch, and source-aligned validity. Likely follow-ups are:

* a two-pass boundary writer using count → `GPUScan` → write;
* a hybrid coordinate encoder with an ambiguity mask;
* fixed-radius neighborhood expansion with explicit output capacity;
* parent/child transforms that remain entirely in integer space.
