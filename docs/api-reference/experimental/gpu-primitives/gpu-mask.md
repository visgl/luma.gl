import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUMask

<GPUPrimitivesDocsTabs active="mask" />

`GPUMask` composes GPU-resident visibility, hierarchy, selection, and application-filter masks as
ordinary `GPUCommandGraph` nodes.

```ts
import {GPUMask} from '@luma.gl/experimental';

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
