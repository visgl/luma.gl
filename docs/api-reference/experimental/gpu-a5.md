import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {DGGSCellProjectionBenchmark} from '@site/src/components/docs/dggs-cell-projection-benchmark';

# GPU A5

<ExperimentalDocsTabs active="gpu-a5" />

`@luma.gl/gpgpu/gpu-a5` brings the same GPU-resident cell-center workflow to A5 indexes. Its API is
intentionally identical to the H3 adapter, allowing graph builders to change the grid family
without changing buffer layouts or downstream coordinate consumers.

```ts
import {GPUA5CellProjection} from '@luma.gl/gpgpu/gpu-a5';

new GPUA5CellProjection({
  cells,
  output: longitudeLatitudes,
  validity,
  projection: 'lnglat'
}).addToGraph(graph);
```

## Try it on this device

Choose **A5** below to measure the public A5 adapter. The source set spans representative
resolutions and reflected topology; it is repeated to the chosen array size before upload.

<DGGSCellProjectionBenchmark />

## Shared by design

`GPUA5CellProjection` subclasses the public [`GPUDGGSCellProjection`](./gpu-dggs) contributor.
Buffer validation, word ordering, output formats, validity masks, resource declarations, workload
estimates, bounded dispatch, and benchmark timing are shared with H3. Only the index validation and
topology-to-sphere functions differ.

| Property | A5 behavior |
| --- | --- |
| `cells` | Packed low-word/high-word `uint32x2` by default |
| `projection: 'lnglat'` | Writes `float32x2` longitude/latitude degrees |
| `projection: 'unit-vector'` | Writes normalized `float32x3` Cartesian centers |
| `validity` | Optional `uint32` mask; reserved zero and malformed cells write `0` |

## Resolution and topology

The shader deserializes the A5 resolution and topology bits from the split index, reconstructs the
cell's spherical center, and handles resolution-zero centers explicitly. The unit-vector path is a
natural choice for globe rendering and spatial tests; longitude/latitude is available for labels,
interchange, and downstream projections.

:::tip
**One planner for both grids.**

If an application selects A5 or H3 from data metadata, instantiate `GPUDGGSCellProjection` with a
runtime `family` value. If the grid is fixed, prefer `GPUA5CellProjection`: its import communicates
intent and prevents accidentally selecting another family.
:::

## Composition

A5 output is source-aligned and graph-resident. Common continuations include:

- passing unit vectors directly to a globe model;
- compacting rows with the validity mask;
- computing dot products or angular thresholds without converting back to degrees;
- explicitly reading a small selected subset through a readback ring.

No implicit upload or readback occurs. The caller retains ownership of every buffer and controls
when the compiled graph is submitted.

## Current scope

The module decodes A5 cell centers. Boundary generation, neighborhood traversal, hierarchy
transforms, and coordinate-to-cell encoding are not part of this first API. They can reuse the
shared split-64-bit and command-graph infrastructure while defining their own capacity and
precision contracts.
