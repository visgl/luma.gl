# GPUMask

[Foundation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Tables & joins](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Spatial](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Rendering](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)

[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)

## Overview[​](#overview "Direct link to Overview")

`GPUMask` composes GPU-resident visibility, hierarchy, selection, and application-filter masks as ordinary `GPUCommandGraph` nodes.

## Concepts[​](#concepts "Direct link to Concepts")

A mask is one truth value per source row. Inputs may contain any zero or nonzero values, but the output is canonicalized to `0` or `1`. Boolean composition keeps independent producers decoupled: a viewport test, hierarchy state, and user selection can each own one mask, while downstream scan and compaction consume their combined decision without CPU readback.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Masks are the common currency between independent GPU decisions. A renderer can intersect time, viewport, hierarchy, and level-of-detail masks; a linked chart can union several selections; and an application can subtract muted or invalid rows. Producers remain reusable because none needs to know which other filters are active.

Use a mask when downstream work benefits from source-aligned membership. Add [`GPUCompaction`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md) or [`GPUVisibilityWorkflow`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md) when the consumer instead needs a dense list and count. `GPUMask` only combines existing decisions—it does not evaluate geometric, temporal, or application-specific predicates itself.

```
import {GPUMask} from '@luma.gl/experimental';



new GPUMask({

  id: 'visible-focused-records',

  inputs: [viewportMask, hierarchyMask, focusedSelectionMask],

  output: visibleRecordMask,

  operation: 'and'

}).addToGraph(graph);
```

Every nonzero input is true. Outputs are canonical `0` or `1` and can feed `GPUScan`, `GPUCompaction`, indirect drawing, another mask, or an application-owned shader without readback.

Supported operations:

* `'and'`: retain rows accepted by every input. This is the default.
* `'or'`: retain rows accepted by at least one input.
* `'xor'`: retain rows accepted by an odd number of inputs.
* `'difference'`: retain rows accepted by the first input and none of the remaining inputs.
* `'not'`: invert exactly one input.

Inputs and output must all be packed `GraphDataView<'uint32'>` values or all be `GraphVectorView<'uint32'>` values. Vector masks must have identical ordered chunk topology. Composition emits one pass per nonempty chunk and never concatenates or repacks source data.

The output must use a different physical buffer from all inputs. Graph ownership, command submission, and optional readback remain with the caller. An empty mask adds no compute nodes.
