# GPU Evaluators

[Overview](https://luma.gl/docs/api-reference/gpgpu.md)[GPU evaluators](https://luma.gl/docs/api-reference/gpgpu/gpu-data-evaluator.md)[Operations](https://luma.gl/docs/api-reference/gpgpu/operations.md)[Custom operations](https://luma.gl/docs/api-reference/gpgpu/custom-operation.md)[cleanEvaluate](https://luma.gl/docs/api-reference/gpgpu/clean-evaluate.md)

`@luma.gl/gpgpu` has two evaluator layers:

* `GPUDataEvaluator` runs one lazy transform over one fixed-width `GPUData` chunk or `GPUDataView`.
* `GPUVectorEvaluator` applies one lazy `GPUDataEvaluator` transform independently to every ordered `GPUData` chunk in a `GPUVector`.

There is no `GPUTable` evaluator input path. Streaming code should pass an incoming `GPUData` chunk or borrowed `GPUDataView` directly to `GPUDataEvaluator` operations, or wrap a `GPUVector` with `GPUVectorEvaluator` when the same transform should preserve every existing chunk boundary.

![GPU evaluator split](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDAwIDgyMCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InRpdGxlIGRlc2NyaXB0aW9uIj4KICA8dGl0bGUgaWQ9InRpdGxlIj5HUFUgZXZhbHVhdG9yIHNwbGl0PC90aXRsZT4KICA8ZGVzYyBpZD0iZGVzY3JpcHRpb24iPgogICAgR1BVRGF0YUV2YWx1YXRvciB0cmFuc2Zvcm1zIG9uZSBHUFVEYXRhIGNodW5rLCB3aGlsZSBHUFVWZWN0b3JFdmFsdWF0b3IgbWFwcyBhIHRyYW5zZm9ybSBvdmVyIEdQVVZlY3RvciBjaHVua3Mgd2l0aG91dCBwYWNraW5nIHRoZW0uCiAgPC9kZXNjPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuYmFja2dyb3VuZCB7IGZpbGw6ICNmZmZmZmY7IH0KICAgICAgLnRpdGxlIHsgZmlsbDogIzExMTgyNzsgZm9udDogNzAwIDU0cHggSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmOyB9CiAgICAgIC5zZWN0aW9uIHsgZmlsbDogIzExMTgyNzsgZm9udDogNzAwIDI4cHggSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmOyB9CiAgICAgIC5sYWJlbCB7IGZpbGw6ICMxMTE4Mjc7IGZvbnQ6IDcwMCAyM3B4ICJTRk1vbm8tUmVndWxhciIsIENvbnNvbGFzLCBtb25vc3BhY2U7IH0KICAgICAgLmNhcHRpb24geyBmaWxsOiAjNGI1NTYzOyBmb250OiA1MDAgMjFweCBJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWY7IH0KICAgICAgLnNtYWxsIHsgZmlsbDogIzRiNTU2MzsgZm9udDogNjAwIDE4cHggSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmOyB9CiAgICAgIC5hcnJvdyB7IGZpbGw6IG5vbmU7IHN0cm9rZTogIzZiNzI4MDsgc3Ryb2tlLXdpZHRoOiA4OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IH0KICAgICAgLmFycm93LWhlYWQgeyBmaWxsOiAjNmI3MjgwOyB9CiAgICAgIC5yZW1vdmVkIHsgZmlsbDogI2ZlZTJlMjsgc3Ryb2tlOiAjZWY0NDQ0OyBzdHJva2Utd2lkdGg6IDQ7IH0KICAgICAgLmRhdGEgeyBmaWxsOiAjZjNmNGY2OyBzdHJva2U6ICM5Y2EzYWY7IHN0cm9rZS13aWR0aDogMzsgfQogICAgICAuZGF0YS1ldmFsdWF0b3IgeyBmaWxsOiAjZGJlYWZlOyBzdHJva2U6ICMyNTYzZWI7IHN0cm9rZS13aWR0aDogNDsgfQogICAgICAudmVjdG9yLWV2YWx1YXRvciB7IGZpbGw6ICNkY2ZjZTc7IHN0cm9rZTogIzE2YTM0YTsgc3Ryb2tlLXdpZHRoOiA0OyB9CiAgICAgIC52ZWN0b3IgeyBmaWxsOiAjZjlmYWZiOyBzdHJva2U6ICM2YjcyODA7IHN0cm9rZS13aWR0aDogNDsgfQogICAgICAuY2h1bmsgeyBmaWxsOiAjZTVlN2ViOyBzdHJva2U6ICM5Y2EzYWY7IHN0cm9rZS13aWR0aDogMjsgfQogICAgICAudHJhbnNmb3JtIHsgZmlsbDogI2VjZmVmZjsgc3Ryb2tlOiAjMDg5MWIyOyBzdHJva2Utd2lkdGg6IDM7IH0KICAgICAgLmxlZ2VuZCB7IGZpbGw6ICNmOWZhZmI7IHN0cm9rZTogI2QxZDVkYjsgc3Ryb2tlLXdpZHRoOiAzOyB9CiAgICAgIC5zdHJpa2UgeyBzdHJva2U6ICNlZjQ0NDQ7IHN0cm9rZS13aWR0aDogMTA7IHN0cm9rZS1saW5lY2FwOiByb3VuZDsgfQogICAgICAuZ3JlZW4tYXJyb3cgeyBmaWxsOiBub25lOyBzdHJva2U6ICMxNmEzNGE7IHN0cm9rZS13aWR0aDogNzsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBzdHJva2UtbGluZWpvaW46IHJvdW5kOyB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KCiAgPHJlY3QgY2xhc3M9ImJhY2tncm91bmQiIHdpZHRoPSIxNDAwIiBoZWlnaHQ9IjgyMCIgLz4KICA8dGV4dCBjbGFzcz0idGl0bGUiIHg9IjcwIiB5PSI4MiI+R1BVIGV2YWx1YXRvciBzcGxpdDwvdGV4dD4KCiAgPHRleHQgY2xhc3M9InNlY3Rpb24iIHg9IjcwIiB5PSIxNTUiPlJlbW92ZWQgbWlzbGVhZGluZyBBUEk8L3RleHQ+CiAgPHJlY3QgY2xhc3M9InJlbW92ZWQiIHg9IjcwIiB5PSIxODUiIHdpZHRoPSIzNjAiIGhlaWdodD0iODIiIHJ4PSIyMiIgLz4KICA8dGV4dCBjbGFzcz0ibGFiZWwiIHg9IjExMiIgeT0iMjM3Ij5HUFVUYWJsZUV2YWx1YXRvcjwvdGV4dD4KICA8bGluZSBjbGFzcz0ic3RyaWtlIiB4MT0iOTYiIHkxPSIyNTMiIHgyPSI0MDIiIHkyPSIxOTgiIC8+CiAgPHRleHQgY2xhc3M9InNtYWxsIiB4PSI0NjAiIHk9IjIzMyI+Tm8gR1BVVGFibGUgaW5wdXQgcGF0aDwvdGV4dD4KCiAgPHRleHQgY2xhc3M9InNlY3Rpb24iIHg9IjcwIiB5PSIzNTIiPkdQVURhdGEgcGF0aDwvdGV4dD4KICA8cmVjdCBjbGFzcz0iZGF0YSIgeD0iNzAiIHk9IjM5MCIgd2lkdGg9IjIyMCIgaGVpZ2h0PSI5NiIgcng9IjI0IiAvPgogIDx0ZXh0IGNsYXNzPSJsYWJlbCIgeD0iMTE2IiB5PSI0NDciPkdQVURhdGE8L3RleHQ+CiAgPHBhdGggY2xhc3M9ImFycm93IiBkPSJNIDMxMiA0MzggSCA0MTAiIC8+CiAgPHBvbHlnb24gY2xhc3M9ImFycm93LWhlYWQiIHBvaW50cz0iNDEwLDQzOCAzODIsNDIwIDM4Miw0NTYiIC8+CiAgPHJlY3QgY2xhc3M9ImRhdGEtZXZhbHVhdG9yIiB4PSI0MzAiIHk9IjM3OCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSIxMjAiIHJ4PSIyOCIgLz4KICA8dGV4dCBjbGFzcz0ibGFiZWwiIHg9IjQ5MCIgeT0iNDQ3Ij5HUFVEYXRhRXZhbHVhdG9yPC90ZXh0PgogIDxwYXRoIGNsYXNzPSJhcnJvdyIgZD0iTSA4MTIgNDM4IEggOTEwIiAvPgogIDxwb2x5Z29uIGNsYXNzPSJhcnJvdy1oZWFkIiBwb2ludHM9IjkxMCw0MzggODgyLDQyMCA4ODIsNDU2IiAvPgogIDxyZWN0IGNsYXNzPSJkYXRhIiB4PSI5MzAiIHk9IjM5MCIgd2lkdGg9IjIyMCIgaGVpZ2h0PSI5NiIgcng9IjI0IiAvPgogIDx0ZXh0IGNsYXNzPSJsYWJlbCIgeD0iOTc2IiB5PSI0NDciPkdQVURhdGE8L3RleHQ+CiAgPHJlY3QgY2xhc3M9InRyYW5zZm9ybSIgeD0iNTI1IiB5PSI1MTUiIHdpZHRoPSIxNzAiIGhlaWdodD0iNTQiIHJ4PSIxOCIgLz4KICA8dGV4dCBjbGFzcz0ic21hbGwiIHg9IjU2MCIgeT0iNTQ5Ij50cmFuc2Zvcm08L3RleHQ+CiAgPHRleHQgY2xhc3M9ImNhcHRpb24iIHg9IjcwIiB5PSI1NTciPlJ1bnMgZGlyZWN0bHkgb24gb25lIGluY29taW5nIEdQVURhdGEgY2h1bmsuPC90ZXh0PgoKICA8dGV4dCBjbGFzcz0ic2VjdGlvbiIgeD0iNzAiIHk9IjY1NSI+R1BVVmVjdG9yIHBhdGg8L3RleHQ+CiAgPHJlY3QgY2xhc3M9InZlY3RvciIgeD0iNzAiIHk9IjY4OCIgd2lkdGg9IjM0MCIgaGVpZ2h0PSI5OCIgcng9IjI0IiAvPgogIDx0ZXh0IGNsYXNzPSJsYWJlbCIgeD0iMTAwIiB5PSI3MjQiPkdQVVZlY3RvcjwvdGV4dD4KICA8cmVjdCBjbGFzcz0iY2h1bmsiIHg9IjEwMCIgeT0iNzM4IiB3aWR0aD0iODIiIGhlaWdodD0iMjgiIHJ4PSIxMiIgLz4KICA8cmVjdCBjbGFzcz0iY2h1bmsiIHg9IjE5NCIgeT0iNzM4IiB3aWR0aD0iODIiIGhlaWdodD0iMjgiIHJ4PSIxMiIgLz4KICA8cmVjdCBjbGFzcz0iY2h1bmsiIHg9IjI4OCIgeT0iNzM4IiB3aWR0aD0iODIiIGhlaWdodD0iMjgiIHJ4PSIxMiIgLz4KICA8cGF0aCBjbGFzcz0iYXJyb3ciIGQ9Ik0gNDMyIDczNyBIIDUyMCIgLz4KICA8cG9seWdvbiBjbGFzcz0iYXJyb3ctaGVhZCIgcG9pbnRzPSI1MjAsNzM3IDQ5Miw3MTkgNDkyLDc1NSIgLz4KICA8cmVjdCBjbGFzcz0idmVjdG9yLWV2YWx1YXRvciIgeD0iNTQwIiB5PSI2NzUiIHdpZHRoPSIzOTAiIGhlaWdodD0iMTI0IiByeD0iMjgiIC8+CiAgPHRleHQgY2xhc3M9ImxhYmVsIiB4PSI1OTAiIHk9Ijc0NCI+R1BVVmVjdG9yRXZhbHVhdG9yPC90ZXh0PgogIDxwYXRoIGNsYXNzPSJncmVlbi1hcnJvdyIgZD0iTSA5NTIgNzA3IEggMTA0MiIgLz4KICA8cGF0aCBjbGFzcz0iZ3JlZW4tYXJyb3ciIGQ9Ik0gOTUyIDczNyBIIDEwNDIiIC8+CiAgPHBhdGggY2xhc3M9ImdyZWVuLWFycm93IiBkPSJNIDk1MiA3NjcgSCAxMDQyIiAvPgogIDxwb2x5Z29uIGNsYXNzPSJhcnJvdy1oZWFkIiBwb2ludHM9IjEwNDIsNzA3IDEwMTgsNjkyIDEwMTgsNzIyIiAvPgogIDxwb2x5Z29uIGNsYXNzPSJhcnJvdy1oZWFkIiBwb2ludHM9IjEwNDIsNzM3IDEwMTgsNzIyIDEwMTgsNzUyIiAvPgogIDxwb2x5Z29uIGNsYXNzPSJhcnJvdy1oZWFkIiBwb2ludHM9IjEwNDIsNzY3IDEwMTgsNzUyIDEwMTgsNzgyIiAvPgogIDxyZWN0IGNsYXNzPSJ2ZWN0b3IiIHg9IjEwNjAiIHk9IjY4OCIgd2lkdGg9IjI3MCIgaGVpZ2h0PSI5OCIgcng9IjI0IiAvPgogIDx0ZXh0IGNsYXNzPSJsYWJlbCIgeD0iMTA5MCIgeT0iNzI0Ij5HUFVWZWN0b3I8L3RleHQ+CiAgPHJlY3QgY2xhc3M9ImNodW5rIiB4PSIxMDkwIiB5PSI3MzgiIHdpZHRoPSI2MiIgaGVpZ2h0PSIyOCIgcng9IjEyIiAvPgogIDxyZWN0IGNsYXNzPSJjaHVuayIgeD0iMTE2NCIgeT0iNzM4IiB3aWR0aD0iNjIiIGhlaWdodD0iMjgiIHJ4PSIxMiIgLz4KICA8cmVjdCBjbGFzcz0iY2h1bmsiIHg9IjEyMzgiIHk9IjczOCIgd2lkdGg9IjYyIiBoZWlnaHQ9IjI4IiByeD0iMTIiIC8+CgogIDxyZWN0IGNsYXNzPSJsZWdlbmQiIHg9IjEwMTAiIHk9IjE2NSIgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxNjIiIHJ4PSIyNCIgLz4KICA8dGV4dCBjbGFzcz0ic21hbGwiIHg9IjEwNDQiIHk9IjIwNSI+T2ZmaWNpYWwgQVBJczwvdGV4dD4KICA8dGV4dCBjbGFzcz0ic21hbGwiIHg9IjEwNDQiIHk9IjI0NSI+R1BVRGF0YUV2YWx1YXRvciA9IG9uZSBHUFVEYXRhPC90ZXh0PgogIDx0ZXh0IGNsYXNzPSJzbWFsbCIgeD0iMTA0NCIgeT0iMjc5Ij5HUFVWZWN0b3JFdmFsdWF0b3IgPSBtYXAgY2h1bmtzPC90ZXh0PgogIDx0ZXh0IGNsYXNzPSJjYXB0aW9uIiB4PSI3MCIgeT0iODEyIj5HUFVWZWN0b3JFdmFsdWF0b3IgcHJlc2VydmVzIGNodW5rIGJvdW5kYXJpZXMgYW5kIGRvZXMgbm90IHBhY2sgc3RyZWFtaW5nIGRhdGEgaW1wbGljaXRseS48L3RleHQ+Cjwvc3ZnPgo=)

## Usage[​](#usage "Direct link to Usage")

### One incoming `GPUData`[​](#one-incoming-gpudata "Direct link to one-incoming-gpudata")

```
import {GPUDataEvaluator, add} from '@luma.gl/gpgpu';



const offset = GPUDataEvaluator.fromConstant([1, 2, 3]);

const translatedChunk = add(incomingGPUData, offset);



const translatedVector = await translatedChunk.evaluate(device);
```

### One `GPUVector`[​](#one-gpuvector "Direct link to one-gpuvector")

```
import {GPUDataEvaluator, GPUVectorEvaluator, add} from '@luma.gl/gpgpu';



const offset = GPUDataEvaluator.fromConstant([1, 2, 3]);

const translatedVector = GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(data =>

  add(data, offset)

);



const outputVector = await translatedVector.evaluate(device);
```

`GPUVectorEvaluator` preserves `vector.data[]` order and chunk boundaries. It does not combine streaming batches or pack buffers implicitly.

### Interleaved attribute input[​](#interleaved-attribute-input "Direct link to Interleaved attribute input")

```
import {add} from '@luma.gl/gpgpu';

import {makeGPUDataViewFromAttribute} from '@luma.gl/gpgpu/gpu-data';



const positions = makeGPUDataViewFromAttribute({

  buffer: interleavedBuffer,

  bufferLayout,

  attributeName: 'positions',

  length: instanceCount

});



const translatedPositions = add(positions, [10, 0, 0]);

const packedOutput = await translatedPositions.evaluate(device);
```

Input views retain their offset and stride, so multiple attributes may borrow the same interleaved buffer. Operation results remain newly materialized packed outputs; evaluating into an interleaved destination is not implicit.

## `GPUDataEvaluator`[​](#gpudataevaluator "Direct link to gpudataevaluator")

`GPUDataEvaluator` describes a 2D row layout backed by CPU values, one borrowed `GPUData` chunk, borrowed `GPUDataView`, another `GPUDataEvaluator`, or a lazy `Operation` output. Each row contains `size` scalar elements of the same numeric type.

### `GPUDataEvaluatorProps`[​](#gpudataevaluatorprops "Direct link to gpudataevaluatorprops")

| Property      | Type                                    | Description                                                                            |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `id?`         | `string`                                | Optional debug name used by `toString()`.                                              |
| `type`        | `SignedDataType`                        | Scalar element type, such as `'float32'` or `'uint32'`.                                |
| `size`        | `number`                                | Number of scalar elements in each row.                                                 |
| `offset?`     | `number`                                | Byte offset to the first element of the first row. Defaults to `0`.                    |
| `stride?`     | `number`                                | Byte distance between adjacent rows. Defaults to `ValueType.BYTES_PER_ELEMENT * size`. |
| `normalized?` | `boolean`                               | Whether integer values are normalized when exposed as vertex formats.                  |
| `value?`      | `TypedArray`                            | CPU-side data for the evaluator.                                                       |
| `buffer?`     | `Buffer \| DynamicBuffer`               | Borrowed GPU buffer backing this evaluator.                                            |
| `gpuData?`    | `GPUData`                               | Borrowed fixed-width GPUData chunk backing this evaluator.                             |
| `format?`     | `GPUVectorFormat`                       | Optional memory format preserved for GPUVector interop.                                |
| `source?`     | `Operation \| GPUDataEvaluator \| null` | Lazy source for this evaluator.                                                        |
| `isConstant?` | `boolean`                               | Whether every row shares the same value. Defaults to `false`.                          |
| `length?`     | `number`                                | Row count. Optional when `isConstant` is `true` or `value` is provided.                |

### Static Methods[​](#static-methods "Direct link to Static Methods")

#### `GPUDataEvaluator.fromArray(value, props?): GPUDataEvaluator`[​](#gpudataevaluatorfromarrayvalue-props-gpudataevaluator "Direct link to gpudataevaluatorfromarrayvalue-props-gpudataevaluator")

Creates one evaluator from a typed array or numeric array. Plain JavaScript arrays use `props.type` or `'float32'` by default. `Float64Array` inputs are reinterpreted as `uint32` pairs for GPU-oriented operations such as `fround()`.

#### `GPUDataEvaluator.fromConstant(value, type?): GPUDataEvaluator`[​](#gpudataevaluatorfromconstantvalue-type-gpudataevaluator "Direct link to gpudataevaluatorfromconstantvalue-type-gpudataevaluator")

Creates one constant evaluator with a shared row value. A scalar becomes a one-element row, and an array becomes a row with `value.length` elements.

#### `GPUDataEvaluator.fromGPUData(data, options?): GPUDataEvaluator`[​](#gpudataevaluatorfromgpudatadata-options-gpudataevaluator "Direct link to gpudataevaluatorfromgpudatadata-options-gpudataevaluator")

Creates one evaluator view over a fixed-width `GPUData` chunk. The input must have a fixed-width `GPUData.format` and matching `rowByteLength`. Strided rows are preserved. The evaluator borrows `data.buffer` and does not destroy it.

#### `GPUDataEvaluator.fromGPUDataView(view, options?): GPUDataEvaluator`[​](#gpudataevaluatorfromgpudataviewview-options-gpudataevaluator "Direct link to gpudataevaluatorfromgpudataviewview-options-gpudataevaluator")

Creates an evaluator over a borrowed fixed-width `GPUDataView`, preserving its format, length, byte offset, and byte stride. Existing operations accept views directly through `GPUDataEvaluatorInput`.

CPU, WebGL, and WebGPU support strided 32-bit component formats. Other formats remain subject to backend capabilities; unsupported WebGPU storage types fail explicitly rather than being repacked. Offsets and strides must be aligned to the stored scalar component width.

### Methods[​](#methods "Direct link to Methods")

#### `evaluate(device: Device, options?): Promise<GPUVector>`[​](#evaluatedevice-device-options-promisegpuvector "Direct link to evaluatedevice-device-options-promisegpuvector")

Materializes one single-chunk `GPUVector` on the provided device. Lazy dependencies are evaluated before the operation handler writes the output.

#### `evaluateSync(device: Device, options?): GPUVector`[​](#evaluatesyncdevice-device-options-gpuvector "Direct link to evaluatesyncdevice-device-options-gpuvector")

Materializes one single-chunk `GPUVector` synchronously. This is useful for call sites that must stay synchronous, but it is stricter than `evaluate()`:

* backend lookup must already be resolved
* dependencies are evaluated recursively without awaiting
* any required CPU value must already be available

If those conditions are not met, `evaluateSync()` throws.

#### `readValue(startRow?: number, endRow?: number): Promise<TypedArray>`[​](#readvaluestartrow-number-endrow-number-promisetypedarray "Direct link to readvaluestartrow-number-endrow-number-promisetypedarray")

Reads evaluator contents back to the CPU. This is intended for debugging or inspection and may be slower than staying on the GPU.

#### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Releases cached GPU storage owned by this evaluator and prevents future evaluation.

## `GPUVectorEvaluator`[​](#gpuvectorevaluator "Direct link to gpuvectorevaluator")

`GPUVectorEvaluator` is the official `GPUVector` path. It wraps ordered `GPUDataEvaluator` chunks and materializes one output `GPUVector` with the same chunk boundaries.

### Static Methods[​](#static-methods-1 "Direct link to Static Methods")

#### `GPUVectorEvaluator.fromGPUVector(vector): GPUVectorEvaluator`[​](#gpuvectorevaluatorfromgpuvectorvector-gpuvectorevaluator "Direct link to gpuvectorevaluatorfromgpuvectorvector-gpuvectorevaluator")

Creates one chunk-preserving evaluator over a fixed-width `GPUVector`. The vector must have at least one `GPUData` chunk and must not be interleaved.

#### `GPUVectorEvaluator.fromGPUDataEvaluators(evaluators, options?): GPUVectorEvaluator`[​](#gpuvectorevaluatorfromgpudataevaluatorsevaluators-options-gpuvectorevaluator "Direct link to gpuvectorevaluatorfromgpudataevaluatorsevaluators-options-gpuvectorevaluator")

Creates one vector evaluator from already-built ordered chunk evaluators.

### Methods[​](#methods-1 "Direct link to Methods")

#### `mapGPUData(transform): GPUVectorEvaluator`[​](#mapgpudatatransform-gpuvectorevaluator "Direct link to mapgpudatatransform-gpuvectorevaluator")

Applies one lazy `GPUDataEvaluator` transform independently to each preserved chunk. Use this for row-local streaming transforms that should not repack source batches.

#### `evaluate(device: Device, options?): Promise<GPUVector>`[​](#evaluatedevice-device-options-promisegpuvector-1 "Direct link to evaluatedevice-device-options-promisegpuvector-1")

Materializes every chunk evaluator and returns one `GPUVector` with preserved chunk order and boundaries.

#### `evaluateSync(device: Device, options?): GPUVector`[​](#evaluatesyncdevice-device-options-gpuvector-1 "Direct link to evaluatesyncdevice-device-options-gpuvector-1")

Synchronously materializes every chunk evaluator and returns one `GPUVector` with preserved chunk order and boundaries. This has the same synchronous requirements as `GPUDataEvaluator.evaluateSync()`.

#### `destroy(): void`[​](#destroy-void-1 "Direct link to destroy-void-1")

Releases cached GPU resources owned through child `GPUDataEvaluator` instances.

## Remarks[​](#remarks "Direct link to Remarks")

* Leaf operations accept `GPUDataEvaluator`, `GPUData`, or `GPUDataView`, not `GPUVector`.
* Use `GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(...)` for vector-wide transforms that should preserve streaming chunks.
* `GPUDataEvaluator` operation outputs own their materialized single-chunk `GPUVector` backing resource.
* Borrowed `GPUData` chunks are not destroyed by `GPUDataEvaluator.destroy()`.
* Borrowed `GPUDataView` buffers are not destroyed by `GPUDataEvaluator.destroy()`.
* Synchronous evaluation is intended for already-prepared graphs where backend registration and any required CPU values are available up front.
