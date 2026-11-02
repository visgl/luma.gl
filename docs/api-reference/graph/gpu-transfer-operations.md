# Upload and copy operations

`GPUUploadOperation` and `GPUCopyOperation` use the same descriptions in `GPUGraph` and
reusable `GPUSimpleGraph`. They compose with expressions in program order and define their
own results. Import them from `@luma.gl/graph`.

```typescript
import {GPUGraph, GPUUploadOperation, GPUCopyOperation, GPUExpressionOperation} from '@luma.gl/graph';

const graph = new GPUGraph(); // Or new GPUSimpleGraph() for WebGL/WebGPU.
graph.add([
  new GPUUploadOperation({
    output: 'positions',
    format: 'float32x2',
    data: new Float32Array([1, 2, 3, 4])
  }),
  new GPUExpressionOperation({output: 'scaled', expression: 'positions * 2'}),
  new GPUCopyOperation({input: 'scaled', output: 'result'})
]);
const compiled = graph.compile(device);
const {result} = await compiled.run({});
// Use result, then release it. Each run produces independent storage.
result.destroy();
compiled.destroy();
```

## Upload

| Property | Meaning |
| --- | --- |
| `output` | Name of the produced vector. |
| `format` | `float32`, `sint32`, or `uint32`, optionally with `x2`, `x3`, or `x4`. |
| `data` | Matching `Float32Array`, `Int32Array`, or `Uint32Array`, or an array of those chunks. |
| `id` | Optional diagnostic identifier. |

Data must contain complete packed rows. Construction snapshots the supplied arrays, including
subarray offsets: later CPU mutations do not change the operation. An array of typed arrays
preserves every chunk, including empty chunks. No implicit concatenation or type conversion
occurs. Use expressions for numeric conversions.

This is an immutable upload recipe. For data that changes between executions, declare an input
with `addInput()` and supply a `GPUVector` at execution; the upload operation does not introduce
a second host-input binding API.

## Copy

| Property | Meaning |
| --- | --- |
| `input` | Name of an existing vector. |
| `output` | Name of the produced vector. |
| `id` | Optional diagnostic identifier. |

Copy preserves the format, row count, and chunk partition. It copies row bytes into independent
storage without readback. It does not cast, gather, compact, or repartition rows. To copy a
subrange, bind a vector whose chunks describe that range, using `GPUData.byteOffset` and
`length`. Reusable graph bindings currently require packed 32-bit rows.

For capacity/count results, copying the vector copies its entire capacity. The associated
count remains a separate graph value; select it explicitly if the caller needs it.

## Execution and ownership

Both operations support the normal `outputTargets` bindings. Supplied targets remain borrowed;
automatically allocated selected results belong to the caller. Targets must match format and
chunk lengths and must not alias inputs or other results. Unselected results are graph scratch.

`GPUGraph.prepare()` allocates staging resources without submitting work. Uploads and copies
are encoded in order on the caller's encoder. Keep the prepared execution alive through
submission, then destroy it to release staging and scratch. `run()` handles that lifecycle.

Reusable SimpleGraph executes the same descriptions on WebGL or WebGPU. Its existing
`GPUSimpleGraphUploadOperation`, `GPUSimpleGraphCopyOperation`, and evaluator recipe APIs
retain their existing lazy evaluation, caching, and ownership behavior. These new shared
operations belong to the reusable `compile(device)` interface.
