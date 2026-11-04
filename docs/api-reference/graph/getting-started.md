# Getting started with graphs

A graph describes a GPU computation before its input data is supplied. Declare the external inputs, add operations, choose the results you want to keep, and compile. Each execution binds actual data; operations define intermediate values and the graph manages their storage.

Start with `GPUGraph` on a WebGPU device. For the shared expression subset on WebGL, use [`GPUSimpleGraph`](https://luma.gl/docs/api-reference/graph/gpu-simple-graph.md). A semantic operation is not automatically portable between the two implementations.

## 1. Describe the computation[​](#1-describe-the-computation "Direct link to 1. Describe the computation")

```
import {GPUGraph, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';



const graph = new GPUGraph();

graph.addInput('values', gpuGraph.vector('float32'));

graph.addInput('scale', gpuGraph.scalar('float32'));

graph.add([

  new GPUExpressionOperation({output: 'scaled', expression: 'values * scale'}),

  new GPUExpressionOperation({output: 'result', expression: 'scaled + 1'})

]);
```

Names connect operations. `values` and `scale` are inputs; `scaled` and `result` are produced values. There is no separate declaration or buffer allocation for either produced value. Add producers before consumers. The [expression reference](https://luma.gl/docs/api-reference/graph/gpu-expression-operation.md) explains functions, casts, typed rows, component access, and selection.

`gpuGraph.vector('float32')` describes the stored row format, not its length. Length and chunk boundaries come from the `GPUVector` supplied for each execution. A `float32x3` vector has three components per row; it is not three separate graph values. `gpuGraph.scalar('float32')` accepts a JavaScript number at execution time.

## 2. Compile once, supply data per execution[​](#2-compile-once-supply-data-per-execution "Direct link to 2. Compile once, supply data per execution")

The following continuation accepts an already-created WebGPU `Device`. It uploads three rows and explicitly reads back the result to make the example verifiable. Applications can instead keep the result on the GPU for rendering or another graph.

```
import {Buffer, type Device} from '@luma.gl/core';

import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';



async function runExample(device: Device): Promise<number[]> {

  const compiled = graph.compile(device, {outputs: ['result']});

  let input: GPUVector | undefined;

  let outputs: Record<string, GPUVector> | undefined;

  try {

    input = new GPUVector({

      type: 'data',

      format: 'float32',

      ownsData: true,

      data: [new GPUData({

        buffer: device.createBuffer({

          data: new Float32Array([1, 2, 3]),

          usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST

        }),

        format: 'float32',

        length: 3,

        ownsBuffer: true

      })]

    });

    outputs = await compiled.run({inputs: {values: input, scale: 2}});

    const bytes = await outputs.result.data[0].buffer.readAsync(0, 12);

    return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 3)); // [3, 5, 7]

  } finally {

    outputs?.result.destroy();

    input?.destroy();

    compiled.destroy();

  }

}
```

`run()` prepares storage, encodes, and submits. Its promise returns GPU results; it does not mean GPU work has completed. The explicit `readAsync()` above waits for readback. Reuse the compiled graph with different input vectors or scalar values instead of rebuilding it for each batch. `outputs` selects values to retain, not a list of buffers that the caller must allocate.

## 3. Understand ownership[​](#3-understand-ownership "Direct link to 3. Understand ownership")

| Resource                           | Owner              | Cleanup                                                                    |
| ---------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| Input vector and initialized state | Caller             | Keep alive through submission and subsequent uses                          |
| Unselected operation result        | Prepared execution | Compiler-managed transient storage; eligible results can reuse allocations |
| Returned allocated output          | Caller             | Destroy when no longer needed by submitted or future consumers             |
| Caller-supplied output target      | Caller             | Borrowed by the execution; never destroyed by graph cleanup                |
| Reusable compiled graph            | Caller             | Destroy after its executions have been submitted or abandoned              |

Chunk boundaries are preserved. Expressions require matching vector-input partitions; the graph does not silently concatenate or repack data. Reuse is within one invocation, not a cache shared between concurrent executions. See [values and storage](https://luma.gl/docs/api-reference/graph/gpu-graph-values.md) for state, targets, lifetime rules, and allocation limits.

## 4. Compose with a frame[​](#4-compose-with-a-frame "Direct link to 4. Compose with a frame")

Use `compiled.prepare({inputs, state, outputTargets})` when the application owns submission. Its `outputs` are available for binding immediately. Call `execution.encode(encoder)`, append other graph or rendering commands, submit once, then `execution.destroy()` to release scratch. Each prepared execution encodes once. Outputs remain caller-owned even if the execution is cancelled. The [caller-owned encoding example](https://luma.gl/docs/api-reference/graph/gpu-graph-values.md#caller-owned-encoding) shows complete failure cleanup.

## Where to go next[​](#where-to-go-next "Direct link to Where to go next")

* [Graph inputs, results, and state](https://luma.gl/docs/api-reference/graph/gpu-graph-values.md): declarations, execution bindings, ownership, and sizing.
* [Expression syntax](https://luma.gl/docs/api-reference/graph/gpu-expression-operation.md): the built-in expression operation shared with SimpleGraph.
* [GPUOperation contracts](https://luma.gl/docs/api-reference/graph/gpu-operation.md): define a logical operation and supply its lowering.
* [Command-graph concepts](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md): passes, hazards, transient resources, and scheduling beneath the operation API.
* [Evaluator operations](https://luma.gl/docs/api-reference/graph/operations.md): the separate lazy evaluator API, including operations outside the shared expression subset.

GPU-generated sizes, staged exact-size allocation, automatic results inside control flow, and reusable texture bindings are not part of this path. Advanced fixed-shape command graphs have their own [resource and execution contracts](https://luma.gl/docs/api-reference/experimental/gpu-core/resources.md).
