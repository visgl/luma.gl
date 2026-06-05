import {GPGPUDocsTabs} from '@site/src/components/docs/gpgpu-docs-tabs';

# GPUDataEvaluator

<GPGPUDocsTabs active="gpu-data-evaluator" />

`GPUDataEvaluator` is the single-chunk lazy data container in `@luma.gl/gpgpu`.
It describes a 2D table of numeric values backed by CPU data, another
`GPUDataEvaluator`, one packed `GPUData` chunk, a legacy packed single-chunk
`GPUVector`, or the output of a lazy operation.

`GPUDataEvaluator` remains a compatibility alias for `GPUDataEvaluator`.
Use [`GPUVectorEvaluator`](/docs/api-reference/gpgpu/gpu-data-evaluator) when one
transform should run independently over every `GPUData` chunk in a `GPUVector`
without packing streaming batches together.

Each row contains `size` elements of the same numeric type. Tables can represent tightly packed rows or strided data with a byte `offset` and `stride`.

## Usage

```ts
import {GPUDataEvaluator, add} from '@luma.gl/gpgpu';

const positions = GPUDataEvaluator.fromArray(new Float32Array([
  0, 0, 0,
  1, 0, 0,
  0, 1, 0
]), {size: 3});

const offset = GPUDataEvaluator.fromConstant([1, 2, 3]);
const translated = add(positions, offset);

await translated.evaluate(device);
const values = await translated.readValue();
```

## Types

### `GPUDataEvaluatorProps`

| Property | Type | Description |
| --- | --- | --- |
| `id?` | `string` | Optional debug name used by `toString()`. |
| `type` | `SignedDataType` | Scalar element type, such as `'float32'` or `'uint32'`. |
| `size` | `number` | Number of scalar elements in each row. |
| `offset?` | `number` | Byte offset to the first element of the first row. Defaults to `0`. |
| `stride?` | `number` | Byte distance between adjacent rows. Defaults to `ValueType.BYTES_PER_ELEMENT * size`. |
| `value?` | `TypedArray` | CPU-side data for the table. Required unless `source` is provided. |
| `buffer?` | `Buffer` | Borrowed GPU buffer backing this evaluator. |
| `gpuData?` | `GPUData` | Borrowed packed numeric GPUData chunk backing this evaluator. |
| `gpuVector?` | `GPUVector` | Borrowed legacy single-chunk numeric GPUVector resource backing this evaluator. |
| `format?` | `GPUVectorFormat` | Optional memory format preserved for GPUVector interop. |
| `source?` | `Operation \| GPUDataEvaluator \| null` | Lazy data source for this table. |
| `isConstant?` | `boolean` | Whether every row shares the same value. Defaults to `false`. |
| `length?` | `number` | Row count. Optional when `isConstant` is `true` or `value` is provided. |

## Static Methods

### `GPUDataEvaluator.fromArray(value, props?): GPUDataEvaluator`

Creates a table from a typed array or numeric array. When passed a plain JavaScript array, the method creates a typed array using `props.type` or `'float32'` by default.

If `value` is a `Float64Array`, it is reinterpreted as `uint32` pairs so it can be used by GPU-oriented operations such as `fround()`.

### `GPUDataEvaluator.fromConstant(value, type?): GPUDataEvaluator`

Creates a constant table with one shared row value. A scalar becomes a one-element row, and an array becomes a row with `value.length` elements.

### `GPUDataEvaluator.fromGPUVector(vector): GPUDataEvaluator`

Creates an evaluator view over a packed numeric `GPUVector`. The input must have
one `GPUData` chunk, a fixed non-`vertex-list` `GPUVector.format`, and tightly
packed rows. The evaluator borrows `vector.data[0].buffer` and does not destroy
it.

### `GPUDataEvaluator.fromGPUData(data): GPUDataEvaluator`

Creates an evaluator view over one packed numeric `GPUData` chunk. The input
must have a fixed non-`vertex-list` `GPUData.format` and tightly packed rows.
The evaluator borrows `data.buffer` and does not destroy it.

### `GPUVectorEvaluator.fromGPUVector(vector): GPUVectorEvaluator`

Creates a chunk-preserving vector evaluator over one packed numeric `GPUVector`.
Use `.mapGPUData(transform)` to build one `GPUDataEvaluator` transform per
preserved `GPUData` chunk, then call `.evaluate(device)` to materialize one
output `GPUVector` with matching chunk boundaries.

## Properties

### `type`

Scalar element type for each stored value.

### `size`

Number of scalar elements in each row.

### `offset`, `stride`

Byte layout information for reading rows from the underlying data.

### `isConstant`

Whether all rows share the same value.

### `length`

Number of rows in the table.

### `byteLength`

Total storage size in bytes.

### `ValueType`

Typed-array constructor associated with `type`.

### `value`

CPU-side typed array, when available. This may come from construction or from a later `readValue()` call.

### `gpuVector`

Materialized GPUVector resource for the table. Accessing this before `evaluate()` throws.

### `buffer`

Materialized `Buffer` backing the table. Accessing this before `evaluate()` throws.

## Methods

### `constructor(props: GPUDataEvaluatorProps)`

Creates a table from explicit layout and source information.

### `evaluate(device: Device, options?): Promise<GPUVector>`

Materializes the table on the provided device and returns the immutable `GPUVector` backing this evaluator. If the table was created from an operation, all dependencies are evaluated first and the operation is executed lazily at this point.

### `readValue(startRow?: number, endRow?: number): Promise<TypedArray>`

Reads table contents back to the CPU. This is primarily for debugging or inspection and may be slower than staying on the GPU.

When rows are tightly packed, the returned typed array references a contiguous slice. For strided tables, the method copies each row into a compact array before returning it.

### `toString(): string`

Returns the debug id, source description, or class name.

### `destroy(): void`

Releases any cached GPU buffer and prevents future evaluation.

## Remarks

- `GPUDataEvaluator` is immutable in shape. To produce a new table, create another `GPUDataEvaluator` or use an operation that returns one.
- Evaluation is lazy. Creating operation chains does not allocate GPU resources until `evaluate()` is called on an output table.
- Operation outputs are evaluators backed by immutable materialized buffers, not scratch buffers.
- `GPUData` and legacy single-chunk `GPUVector` inputs are borrowed through their
  `GPUData` buffers; operation outputs own their materialized `GPUVector`
  backing resources.
- Streaming code should use `GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(...)`
  when the same lazy transform must run across every preserved GPUData chunk.
- Constant tables are useful for broadcasting values across every row of a non-constant input.
