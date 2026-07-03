import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUReduction

<GPUPrimitivesDocsTabs active="reduction" />

`GPUReduction` records a deterministic hierarchical reduction over a packed `uint32`, `sint32`,
or `float32` graph view.

```ts
new GPUReduction({input: values, output: extent, operation: 'extent'}).addToGraph(graph);
```

## Constructor

```ts
type GPUReductionProps<T extends 'uint32' | 'sint32' | 'float32'> = {
  id?: string;
  input: GraphDataView<T>;
  output: GraphDataView<T>;
  operation: 'sum' | 'min' | 'max' | 'extent';
};
```

`sum`, `min`, and `max` require one output row; `extent` writes `[minimum, maximum]` and requires
two. Inputs and outputs use separate caller-owned buffers. Hierarchical scratch is graph-owned.

Integer sums wrap to 32 bits. Floating sums use a fixed 256-way tree. Floating minimum, maximum,
and extent ignore NaN and infinity. Empty inputs and all-invalid floating inputs produce zero.

## `addToGraph(graph)`

Declares reduction levels and a final normalization pass. It does not compile, encode, submit,
map, or destroy imported buffers.
