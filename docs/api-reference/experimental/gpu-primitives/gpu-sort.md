import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {GPUSortExample} from '@site/src/examples';

# GPUSort

<GPUPrimitivesDocsTabs active="sort" />

`GPUSort` adds a stable, out-of-place key/value sort to a `GPUCommandGraph`. It sorts paired
packed `uint32` graph views without submitting commands or reading results back to the CPU.

The live example exposes dataset size, algorithm selection, sort direction, graph statistics, and result validation:

<GPUSortExample embedded />

```ts
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

## Constructor

### `new GPUSort(props)`

```ts
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

- Every view must have the same logical length and packed, aligned `uint32` storage.
- Output keys and values use separate buffers from the inputs and from each other.
- Equal keys retain their input order in both directions.
- Inputs are not modified. The caller owns all four views and their imported buffers.

`algorithm` defaults to `auto`, which selects bitonic sort through 65,536 rows and stable binary
LSD radix sort for larger inputs. Explicit selection is useful for measurement and testing.
`resolvedAlgorithm` reports the concrete selection.

## `addToGraph(graph)`

Adds all compute passes and transient scratch declarations to the supplied graph. The graph must
own every input and output view. Scratch buffers are graph-owned, participate in transient lifetime
reuse, and are released by `CompiledGPUCommandGraph.destroy()`.

The method does not compile the graph, create an encoder, submit work, or map output buffers.

## Edge cases

- Empty inputs add no graph nodes.
- A single pair adds one copy node.
- Bitonic sort internally pads irregular lengths without exposing sentinels in the output.
- At most `0x80000000` rows are accepted; practical limits are normally lower device buffer and
  dispatch limits.

See the runnable [GPU sort example](/examples/experimental/gpu-sort) for Arrow upload, graph
compilation statistics, algorithm overrides, explicit submission, and result validation.
