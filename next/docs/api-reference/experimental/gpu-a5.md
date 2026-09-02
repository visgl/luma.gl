# GPU A5

[Projection](https://luma.gl/next/docs/api-reference/experimental/gpu-project.md)[Geospatial Kernels](https://luma.gl/next/docs/api-reference/experimental/geospatial.md)[DGGS](https://luma.gl/next/docs/api-reference/experimental/gpu-dggs.md)[H3](https://luma.gl/next/docs/api-reference/experimental/gpu-h3.md)[A5](https://luma.gl/next/docs/api-reference/experimental/gpu-a5.md)

`@luma.gl/gpgpu/gpu-a5` brings the same GPU-resident cell-center workflow to A5 indexes. Its API is intentionally identical to the H3 adapter, allowing graph builders to change the grid family without changing buffer layouts or downstream coordinate consumers.

```
import {GPUA5CellProjection} from '@luma.gl/gpgpu/gpu-a5';



new GPUA5CellProjection({

  cells,

  output: longitudeLatitudes,

  validity,

  projection: 'lnglat'

}).addToGraph(graph);
```

## Try it on this device[​](#try-it-on-this-device "Direct link to Try it on this device")

Choose **A5** below to measure the public A5 adapter. The source set spans representative resolutions and reflected topology; it is repeated to the chosen array size before upload.

### Live DGGS cell-center projection

Decode a repeated, globally distributed set of valid H3 or A5 indexes with the public command-graph primitive. Correctness checks, upload, compilation, and readback stay outside measured submissions.

Ready to decode **262,144** <!-- -->H3<!-- --> indexes into **normalized vectors**.

GridH3 (h3)OutputUnit vector (unit-vector)Cells262,144 (262144)

Run cell projection benchmark

## Shared by design[​](#shared-by-design "Direct link to Shared by design")

`GPUA5CellProjection` subclasses the public [`GPUDGGSCellProjection`](https://luma.gl/next/docs/api-reference/experimental/gpu-dggs.md) contributor. Buffer validation, word ordering, output formats, validity masks, resource declarations, workload estimates, bounded dispatch, and benchmark timing are shared with H3. Only the index validation and topology-to-sphere functions differ.

| Property                    | A5 behavior                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `cells`                     | Packed low-word/high-word `uint32x2` by default                     |
| `projection: 'lnglat'`      | Writes `float32x2` longitude/latitude degrees                       |
| `projection: 'unit-vector'` | Writes normalized `float32x3` Cartesian centers                     |
| `validity`                  | Optional `uint32` mask; reserved zero and malformed cells write `0` |

## Resolution and topology[​](#resolution-and-topology "Direct link to Resolution and topology")

The shader deserializes the A5 resolution and topology bits from the split index, reconstructs the cell's spherical center, and handles resolution-zero centers explicitly. The unit-vector path is a natural choice for globe rendering and spatial tests; longitude/latitude is available for labels, interchange, and downstream projections.

tip

**One planner for both grids.**

If an application selects A5 or H3 from data metadata, instantiate `GPUDGGSCellProjection` with a runtime `family` value. If the grid is fixed, prefer `GPUA5CellProjection`: its import communicates intent and prevents accidentally selecting another family.

## Composition[​](#composition "Direct link to Composition")

A5 output is source-aligned and graph-resident. Common continuations include:

* passing unit vectors directly to a globe model;
* compacting rows with the validity mask;
* computing dot products or angular thresholds without converting back to degrees;
* explicitly reading a small selected subset through a readback ring.

No implicit upload or readback occurs. The caller retains ownership of every buffer and controls when the compiled graph is submitted.

## Current scope[​](#current-scope "Direct link to Current scope")

The module decodes A5 cell centers. Boundary generation, neighborhood traversal, hierarchy transforms, and coordinate-to-cell encoding are not part of this first API. They can reuse the shared split-64-bit and command-graph infrastructure while defining their own capacity and precision contracts.
