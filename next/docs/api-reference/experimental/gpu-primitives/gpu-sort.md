# GPUSort

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUSort` adds one stable, out-of-place key/value ordering to a `GPUCommandGraph`. `GPUBatchSort` applies the same ordering independently to aligned GPU vector chunks, preserving streaming and record-batch boundaries without implicitly packing them. Neither API submits commands or reads results back to the CPU.

## Concepts[​](#concepts "Direct link to Concepts")

### Paired stable sorting preserves identity[​](#paired-stable-sorting-preserves-identity "Direct link to Paired stable sorting preserves identity")

Paired sorting moves each value with its key, so values commonly hold stable source-row IDs. A stable sort preserves the original order of equal keys, and out-of-place output leaves the source buffers unchanged. This is useful for transparent draw ordering, label priority, event ordering, and table permutation because a later consumer can still recover the canonical source row.

### Global order and batch order answer different questions[​](#global-order-and-batch-order-answer-different-questions "Direct link to Global order and batch order answer different questions")

`GPUSort` treats one packed view as one global comparison domain. Use it when every row must be ranked against every other row—for example, one back-to-front draw list or one global event timeline.

`GPUBatchSort` treats every `GraphVectorView` chunk as an independent comparison domain. It keeps the number, order, and length of chunks unchanged. This is the right contract when boundaries are meaningful: streaming record batches may have separate lifetimes, map tiles may render independently, and incremental ingestion may need newly arrived data sorted without rewriting older batches. A row never crosses a boundary, even when its key would place it in another batch under a global sort.

The distinction is deliberate. Silently concatenating chunks would allocate packed storage, discard useful partition metadata, and turn an incremental operation into whole-dataset work. Callers that need a global order across chunks must explicitly choose and provision a packed representation.

### Algorithm selection follows the work unit[​](#algorithm-selection-follows-the-work-unit "Direct link to Algorithm selection follows the work unit")

Bitonic sort favors smaller fixed networks; radix sort scales larger inputs by partitioning key bits while preserving stability. `GPUSort` selects once for its packed view. `GPUBatchSort` selects independently for every chunk, so one graph can use bitonic for small batches and radix for a large batch. `resolvedAlgorithms` reports those choices in source-chunk order.

Scratch remains graph-owned and batch-local. Empty chunks add no nodes, single-row chunks use the copy fast path, and later chunk sorts can reuse transient allocations from earlier chunks.

The live example switches between one packed Arrow column and preserved Arrow chunks. Its large streaming case intentionally exercises bitonic and radix sorting in the same graph:

```
import {GPUCommandGraph, GPUSort} from '@luma.gl/experimental';

const graph = new GPUCommandGraph(device, {id: 'sort-records'});
const keyChunks = graph.importGPUVector('keys', keyVector);
const valueChunks = graph.importGPUVector('values', rowIdVector);
const keys = keyChunks.data[0]!;
const values = valueChunks.data[0]!;
const outputKeyHandle = graph.importBuffer(
  {id: 'output-keys', byteLength, usage: outputKeyBuffer.usage},
  outputKeyBuffer
);
const outputValueHandle = graph.importBuffer(
  {id: 'output-values', byteLength, usage: outputValueBuffer.usage},
  outputValueBuffer
);

const sort = new GPUSort({
  keys,
  values,
  outputKeys: graph.createDataView(outputKeyHandle, {format: 'uint32', length}),
  outputValues: graph.createDataView(outputValueHandle, {format: 'uint32', length}),
  algorithm: 'auto',
  direction: 'ascending'
});
sort.addToGraph(graph);

const compiled = graph.compile();
const commandEncoder = device.createCommandEncoder({id: 'sort-records'});
compiled.encode(commandEncoder, {parameters: undefined});
device.submit(commandEncoder.finish());
```

For independent batch order, import aligned input and output vectors directly:

```
import {GPUBatchSort, GPUCommandGraph} from '@luma.gl/experimental';

const graph = new GPUCommandGraph(device, {id: 'sort-stream'});
const sort = new GPUBatchSort({
  keys: graph.importGPUVector('keys', keyVector),
  values: graph.importGPUVector('row-ids', rowIdVector),
  outputKeys: graph.importGPUVector('sorted-keys', outputKeyVector),
  outputValues: graph.importGPUVector('sorted-row-ids', outputRowIdVector),
  algorithm: 'auto',
  direction: 'ascending'
});
sort.addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

### `new GPUSort(props)`[​](#new-gpusortprops "Direct link to new-gpusortprops")

```
type GPUSortProps = {
  id?: string;
  keys: GraphDataView<'uint32'>;
  values: GraphDataView<'uint32'>;
  outputKeys: GraphDataView<'uint32'>;
  outputValues: GraphDataView<'uint32'>;
  algorithm?: 'auto' | 'bitonic' | 'radix';
  direction?: 'ascending' | 'descending';
};
```

* Every view must have the same logical length and packed, aligned `uint32` storage.
* Output keys and values use separate buffers from the inputs and from each other.
* Equal keys retain their input order in both directions.
* Inputs are not modified. The caller owns all four views and their imported buffers.

`algorithm` defaults to `auto`, which selects bitonic sort through 65,536 rows and stable binary LSD radix sort for larger inputs. Explicit selection is useful for measurement and testing. `resolvedAlgorithm` reports the concrete selection.

### `new GPUBatchSort(props)`[​](#new-gpubatchsortprops "Direct link to new-gpubatchsortprops")

```
type GPUBatchSortProps = {
  id?: string;
  keys: GraphVectorView<'uint32'>;
  values: GraphVectorView<'uint32'>;
  outputKeys: GraphVectorView<'uint32'>;
  outputValues: GraphVectorView<'uint32'>;
  algorithm?: 'auto' | 'bitonic' | 'radix';
  direction?: 'ascending' | 'descending';
};
```

* All four vectors must have identical ordered chunk lengths and packed `uint32` chunks.
* Output chunks cannot alias any input chunk or the other output vector.
* Sorting is stable within each chunk. Stability and ordering do not extend across boundaries.
* `resolvedAlgorithms` contains one concrete choice per chunk in source order.
* Inputs and outputs remain caller-owned; no vector is concatenated or repacked.

## `addToGraph(graph)`[​](#addtographgraph "Direct link to addtographgraph")

Adds all compute passes and transient scratch declarations to the supplied graph. The graph must own every input and output view. Scratch buffers are graph-owned, participate in transient lifetime reuse, and are released by `CompiledGPUCommandGraph.destroy()`.

The method does not compile the graph, create an encoder, submit work, or map output buffers.

## Edge cases[​](#edge-cases "Direct link to Edge cases")

* Empty inputs and empty batches add no graph nodes.
* A single pair or single-row batch adds one copy node.
* Bitonic sort internally pads irregular lengths without exposing sentinels in the output.
* At most `0x80000000` rows are accepted; practical limits are normally lower device buffer and dispatch limits.

See the runnable [GPU sort example](https://luma.gl/next/examples/experimental/gpu-sort) for packed and preserved-batch Arrow upload, per-batch algorithm selection, graph compilation statistics, explicit submission, and CPU-oracle validation.
