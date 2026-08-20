import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUMask

<GPUCoreDocsTabs active="mask" />

## Overview

`GPUMask` composes GPU-resident visibility, hierarchy, selection, and application-filter masks as
ordinary `GPUCommandGraph` nodes.

<GPUOperationContract operation="gpu-mask" />

## Concepts

A mask is one truth value per source row. Inputs may contain any zero or nonzero values, but the
output is canonicalized to `0` or `1`. Boolean composition keeps independent producers decoupled:
a viewport test, hierarchy state, and user selection can each own one mask, while downstream scan
and compaction consume their combined decision without CPU readback.

### When to use it

Masks are the common currency between independent GPU decisions. A renderer can intersect time,
viewport, hierarchy, and level-of-detail masks; a linked chart can union several selections; and an
application can subtract muted or invalid rows. Producers remain reusable because none needs to
know which other filters are active.

Use a mask when downstream work benefits from source-aligned membership. Add
[`GPUCompaction`](./gpu-compaction) or [`GPUVisibilityWorkflow`](./gpu-visibility-workflow) when the
consumer instead needs a dense list and count. `GPUMask` only combines existing decisions—it does
not evaluate geometric, temporal, or application-specific predicates itself.

```ts
import {GPUMask} from '@luma.gl/gpgpu/gpu-core';

new GPUMask({
  id: 'visible-focused-records',
  inputs: [viewportMask, hierarchyMask, focusedSelectionMask],
  output: visibleRecordMask,
  operation: 'and'
}).addToGraph(graph);
```

Every nonzero input is true. Outputs are canonical `0` or `1` and can feed `GPUScan`,
`GPUCompaction`, indirect drawing, another mask, or an application-owned shader without readback.

Supported operations:

- `'and'`: retain rows accepted by every input. This is the default.
- `'or'`: retain rows accepted by at least one input.
- `'xor'`: retain rows accepted by an odd number of inputs.
- `'difference'`: retain rows accepted by the first input and none of the remaining inputs.
- `'not'`: invert exactly one input.

Inputs and output must all be packed `GraphDataView<'uint32'>` values or all be
`GraphVectorView<'uint32'>` values. Vector masks must have identical ordered chunk topology.
Composition emits one pass per nonempty chunk and never concatenates or repacks source data.

The output must use a different physical buffer from all inputs. Graph ownership, command
submission, and optional readback remain with the caller. An empty mask adds no compute nodes.
