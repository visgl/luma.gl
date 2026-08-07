# GPUSegmentedSort

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUSegmentedSort` stably sorts many independent key/value domains that already reside in four packed GPU buffers. Each segment remains a separate comparison domain, but equal-width segments share one compute dispatch. One hundred three-row sorts therefore require one graph node and one dispatch, not one hundred individually encoded sorts.

The primitive does not pack streaming chunks, allocate physical GPU buffers, submit commands, or read results back. Its inputs and outputs remain caller-owned `GraphDataView<'uint32'>` views.

## When to use segmented sorting[​](#when-to-use-segmented-sorting "Direct link to When to use segmented sorting")

Choose the contract that matches the source layout:

* [`GPUSort`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md) orders one complete packed domain, including larger inputs that need a multi-workgroup radix sort.
* `GPUBatchSort` preserves independently allocated `GraphVectorView` chunks and selects an algorithm separately for each chunk. CORE WebGPU cannot bind arbitrarily many unrelated chunk buffers in one shader without explicitly repacking them.
* `GPUSegmentedSort` orders independent domains that already share one parent buffer per key, payload, sorted-key, and sorted-payload stream. It never moves a value across segment boundaries and never overwrites padding between segments.

Typical packed-segment workloads include mesh-local Morton permutations, tile-local ordering, spatial bins, and small independent partitions inside explicitly provisioned columnar storage.

## Example[​](#example "Direct link to Example")

```
import {GPUCommandGraph, GPUSegmentedSort} from '@luma.gl/experimental';



const graph = new GPUCommandGraph(device, {id: 'sort-packed-meshes'});



const sort = new GPUSegmentedSort({

  id: 'mesh-morton-order',

  keys: mortonKeyView,

  values: triangleIdView,

  outputKeys: sortedMortonKeyView,

  outputValues: sortedTriangleIdView,

  segments: [

    {

      keysOffset: 0,

      valuesOffset: 0,

      outputKeysOffset: 0,

      outputValuesOffset: 0,

      length: 12

    },

    {

      keysOffset: 16,

      valuesOffset: 16,

      outputKeysOffset: 16,

      outputValuesOffset: 16,

      length: 11

    }

  ]

});



sort.addToGraph(graph);



const compiled = graph.compile();

const commandEncoder = device.createCommandEncoder({id: 'sort-packed-meshes'});

compiled.encode(commandEncoder, {parameters: undefined});

device.submit(commandEncoder.finish());
```

Both example segments fit a 16-lane bitonic network, so they run in separate workgroups within the same `mesh-morton-order-bitonic-local-16` graph node. Output rows 12–15 remain untouched.

## Constructor[​](#constructor "Direct link to Constructor")

### `new GPUSegmentedSort(props)`[​](#new-gpusegmentedsortprops "Direct link to new-gpusegmentedsortprops")

```
type GPUSortSegment = {

  keysOffset: number;

  valuesOffset: number;

  outputKeysOffset: number;

  outputValuesOffset: number;

  length: number;

};



type GPUSegmentedSortProps = {

  id?: string;

  keys: GraphDataView<'uint32'>;

  values: GraphDataView<'uint32'>;

  outputKeys: GraphDataView<'uint32'>;

  outputValues: GraphDataView<'uint32'>;

  segments: readonly GPUSortSegment[];

  direction?: 'ascending' | 'descending';

};
```

All four views must use packed, unsigned 32-bit rows. Each domain offset is expressed in logical rows relative to its own parent view, not as an absolute physical-buffer byte offset. Input and output domains can begin at different rows; the four parent views do not need matching total capacities.

A segment contains zero through 256 rows. Every source and destination range must fit its parent view. Populated sorted-key destination ranges must not overlap each other, and populated sorted-payload destination ranges must not overlap each other. Both destination buffers must be distinct from both source buffers and from one another.

`direction` defaults to `ascending`. Equal keys retain their original segment-local order in both directions, including the maximum unsigned value `0xffffffff`.

The constructor snapshots segment descriptors. Editing the original descriptor objects later does not change a recorded operation. Changing the segment layout requires a new operation and graph; changing only caller-owned key and payload contents does not.

## `addToGraph(graph)`[​](#addtographgraph "Direct link to addtographgraph")

Adds one compute node for each occupied padded workgroup width. Possible widths are 2, 4, 8, 16, 32, 64, 128, and 256, so any number of supported segments requires at most eight nodes. Empty segments add no node; one-row domains share the two-lane bucket with two-row domains.

Every segment is assigned one workgroup. Dispatches automatically expand across all three WebGPU dispatch dimensions where necessary and guard surplus workgroups in partially populated layouts. Node identifiers follow `${id}-bitonic-local-${width}`.

Each workgroup loads its segment keys into shared memory once, performs a stable padded bitonic sorting network, and gathers the paired payload into its corresponding output range. Descriptors are compile-time shader constants, so each generated shader binds only four storage buffers and requires no subgroup extension, timestamp query, descriptor upload, or scratch allocation.

The operation only records graph work. Compilation, encoding, submission, and optional result readback remain application-owned.

## Limitations[​](#limitations "Direct link to Limitations")

Segments larger than 256 rows are rejected. Use `GPUSort` for an individual larger domain or `GPUBatchSort` for separately allocated chunks. A segmented multi-workgroup radix implementation can extend this contract in a future tranche without changing independent-domain semantics.
