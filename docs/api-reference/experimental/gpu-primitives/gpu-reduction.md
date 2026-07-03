import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUReduction

<GPUPrimitivesDocsTabs active="reduction" />

`GPUReduction` records a deterministic hierarchical reduction over a packed `uint32`, `sint32`,
or `float32` graph data view or fixed-width graph vector.

```ts
new GPUReduction({input: values, output: extent, operation: 'extent'}).addToGraph(graph);
```

## Constructor

```ts
type GPUReductionProps<T extends 'uint32' | 'sint32' | 'float32'> = {
  id?: string;
  input: GraphDataView<T> | GraphVectorView<T>;
  output: GraphDataView<T>;
  operation: 'sum' | 'min' | 'max' | 'extent';
};
```

`sum`, `min`, and `max` require one output row; `extent` writes `[minimum, maximum]` and requires
two. Inputs and outputs use separate caller-owned buffers. Hierarchical scratch is graph-owned.

For a `GraphVectorView`, each non-empty `GraphDataView` chunk is reduced independently into
graph-owned partial storage, followed by one global reduction. Chunk order and storage remain
unchanged; no input is packed or concatenated. An all-empty vector follows the same zero-result
behavior as an empty data view.

Integer sums wrap to 32 bits. Floating sums use a fixed 256-way tree. Floating minimum, maximum,
and extent ignore NaN and infinity. Empty inputs and all-invalid floating inputs produce zero.

## Reduction hierarchy

The reduction is planned in levels. Each level dispatches one 256-thread workgroup for every group
of at most 256 input rows, producing one partial row per workgroup. The next level consumes those
partial rows. For example, 100,000 input rows produce 391 partial rows, then 2, then 1.

| Stage | Input | Output |
| --- | --- | --- |
| First level | Packed scalar rows | One partial row per 256 input rows |
| Intermediate levels | Previous partial rows | One partial row per 256 input rows |
| Finalize | One partial row | Caller-owned output view |

`extent` represents each partial row as two adjacent values: minimum and maximum. Floating-point
`min`, `max`, and `extent` carry a parallel `uint32` validity row so that NaN and infinity can be
ignored without choosing a sentinel value. The finalize pass maps a result with no finite values to
zero.

For a multi-chunk vector, each non-empty chunk gets its own hierarchy. The last level of each chunk
writes directly into one slot of a shared partial view. A merge hierarchy then reduces those slots.
Empty chunks add no passes and do not change the result.

All intermediate views are graph-owned transients. Their declared node uses let the command-graph
compiler infer ordering and reuse physical scratch allocations when lifetimes do not overlap.

## `addToGraph(graph)`

Declares reduction levels and a final normalization pass. It does not compile, encode, submit,
map, or destroy imported buffers.
