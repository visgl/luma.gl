# GPUCompactionOperation

`GPUCompactionOperation` is a WebGPU operation that stably selects `uint32` rows. It produces two named values: a vector with sufficient **capacity** and a GPU scalar containing the **logical count**. Applications do not declare or allocate its intermediate storage.

```
import {GPUGraph, gpuGraph, GPUCompactionOperation, GPUExpressionOperation} from '@luma.gl/graph';



const graph = new GPUGraph();

graph.addInput('indices', gpuGraph.vector('uint32'));

graph.addInput('flags', gpuGraph.vector('uint32'));

graph.add(new GPUCompactionOperation({

  input: 'indices', flags: 'flags', output: 'selected', count: 'selectedCount'

}));

// The produced scalar can feed later GPU work without a CPU readback.

graph.add(new GPUExpressionOperation({

  output: 'countAsFloat', expression: 'float32(selectedCount)'

}));

const compiled = graph.compile(device, {outputs: ['selected', 'selectedCount', 'countAsFloat']});

const outputs = await compiled.run({inputs: {indices, flags}});

// outputs.selected.length is capacity, NOT the GPU-generated logical count.

// outputs.selectedCount is a one-row uint32 GPUVector.

// Consume the count on the GPU, or explicitly read it back if the application needs it.

Object.values(outputs).forEach(output => output.destroy());

compiled.destroy();
```

## Properties[​](#properties "Direct link to Properties")

| Property | Meaning                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------ |
| `input`  | Name of a packed `uint32` input vector.                                                                |
| `flags`  | Name of a packed `uint32` mask with the same total row count. Zero rejects; any nonzero value accepts. |
| `output` | Name of the produced vector, with input-sized capacity and the input chunk partition.                  |
| `count`  | Name of the produced `uint32` scalar.                                                                  |
| `id`     | Optional diagnostic identifier.                                                                        |

The accepted rows occupy one **global prefix** across the output's existing chunks, in source order. A chunk boundary is not a selection boundary. Input and flag chunk partitions may differ. Empty input writes count zero. Unwritten capacity beyond the count is unspecified and must not be treated as valid data.

## Capacity and logical count[​](#capacity-and-logical-count "Direct link to Capacity and logical count")

`GPUVector.length` continues to describe the allocated row capacity. The GPU-produced count never silently changes CPU metadata, forces synchronization, or triggers exact-size allocation. This operation reuses the existing graph compaction primitive and command-graph storage planner.

The vector and count are separate named values. Their association is explicit in the operation; the graph does not automatically propagate a validity mask through downstream operations. Ordinary elementwise expressions and copies still process the whole capacity. Reductions, rendering, or dispatches that consume only valid rows must explicitly use `selectedCount`. Do not reduce the unspecified tail. A custom lowering can resolve the count with `context.resolveScalar('selectedCount')` and use its GPU view in its own bounded or indirect work. Declare that scalar as a read in the consumer's operation contract.

Both values are selected by default when they are terminal results. If a later operation consumes the count, select it explicitly in `compile({outputs})` when the caller also needs it. Selected scalars are returned as one-row vectors; unselected counts stay in the graph's scalar arena.

The standard [caller-owned encoding](https://luma.gl/next/docs/api-reference/graph/gpu-graph-values.md#caller-owned-encoding) lifecycle works unchanged, allowing compaction and its consumers to share one submission. Output targets must match the input capacity and partition; compaction does not resize caller-owned storage.

## Current scope[​](#current-scope "Direct link to Current scope")

This operation supports `uint32` values on `GPUGraph` with WebGPU. It does not add compaction to SimpleGraph, general variable-sized vector metadata, automatic count-aware expression execution, or CPU-sized allocation from a GPU count. Other row formats and higher-level counted result abstractions can build on this explicit capacity/count contract.
