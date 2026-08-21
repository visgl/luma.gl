# GPUSegmentedSort

[Sort](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-sort.md)[Segmented Sort](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-sort.md)[Transpose](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-transpose.md)[FFT 1D](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft1d.md)[FFT 2D](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft2d.md)[Convolution](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-convolution.md)

## Overview[​](#overview "Direct link to Overview")

`GPUSegmentedSort` stably sorts many independent key/value domains that already reside in four packed GPU buffers. Each segment remains a separate comparison domain, but equal-width segments share one compute dispatch. One hundred three-row sorts therefore require one graph node and one dispatch, not one hundred individually encoded sorts.

The primitive does not pack streaming chunks, allocate physical GPU buffers, submit commands, or read results back. Its inputs and outputs remain caller-owned `GraphDataView<'uint32'>` views.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Stably sort many independent key/value domains in shared packed buffers.                                      |
| **Reads / writes**       | Reads segment descriptors and source keys/values; writes destination keys/values and status.                  |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | One stable order inside each segment; no order is implied across segments.                                    |
| **Expected work**        | Equal-width segments share a bounded set of sorting dispatches.                                               |
| **Chunks**               | Segments are caller-packed comparison domains, not streaming chunks.                                          |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | packed segment keys/values → GPUSegmentedSort → grouped consumer.                                             |

**Cost**Segment capacity, key width, and the number of shared passes.

**Common mistake**Do not interpret individually sorted segments as one global order.

## When to use segmented sorting[​](#when-to-use-segmented-sorting "Direct link to When to use segmented sorting")

Choose the contract that matches the source layout:

* [`GPUSort`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-sort.md) orders one complete packed domain, including larger inputs that need a multi-workgroup radix sort.
* `GPUBatchSort` preserves independently allocated `GraphVectorView` chunks and selects an algorithm separately for each chunk. CORE WebGPU cannot bind arbitrarily many unrelated chunk buffers in one shader without explicitly repacking them.
* `GPUSegmentedSort` orders independent domains that already share one parent buffer per key, payload, sorted-key, and sorted-payload stream. It never moves a value across segment boundaries and never overwrites padding between segments.

Typical packed-segment workloads include mesh-local Morton permutations, tile-local ordering, spatial bins, and small independent partitions inside explicitly provisioned columnar storage.

## Example[​](#example "Direct link to Example")

```
import {GPUCommandGraph, GPUSegmentedSort} from '@luma.gl/gpgpu/gpu-core';



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

Each workgroup loads its segment keys once, performs a stable padded bitonic sorting network, and gathers the paired payload into its corresponding output range. A subgroup-capable device keeps subgroup-local compare/exchange stages in registers and uses shared memory only across subgroup boundaries. Other devices retain the original all-shared-memory network automatically.

Descriptors are compile-time shader constants, so each generated shader binds only four storage buffers and requires no timestamp query, descriptor upload, or scratch allocation. The optional subgroup path does not change graph nodes, storage, ordering, or the public API.

The operation only records graph work. Compilation, encoding, submission, and optional result readback remain application-owned.

## Limitations[​](#limitations "Direct link to Limitations")

Segments larger than 256 rows are rejected. Use `GPUSort` for an individual larger domain or `GPUBatchSort` for separately allocated chunks. A segmented multi-workgroup radix implementation could extend this contract later without changing independent-domain semantics.
