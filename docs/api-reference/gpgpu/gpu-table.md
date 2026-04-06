# GPUTable

`GPUTable` is the core data container in `@luma.gl/gpgpu`. It describes a 2D table of numeric values that can be backed by CPU data, by another `GPUTable`, or by the output of a lazy operation.

Each row contains `size` elements of the same numeric type. Tables can represent tightly packed rows or strided data with a byte `offset` and `stride`.

## Usage

```ts
import {GPUTable, add} from '@luma.gl/gpgpu';

const positions = GPUTable.fromArray(new Float32Array([
  0, 0, 0,
  1, 0, 0,
  0, 1, 0
]), {size: 3});

const offset = GPUTable.fromConstant([1, 2, 3]);
const translated = add(positions, offset);

await translated.evaluate(device);
const values = await translated.readValue();
```

## Types

### `GPUTableProps`

| Property | Type | Description |
| --- | --- | --- |
| `id?` | `string` | Optional debug name used by `toString()`. |
| `type` | `SignedDataType` | Scalar element type, such as `'float32'` or `'uint32'`. |
| `size` | `number` | Number of scalar elements in each row. |
| `offset?` | `number` | Byte offset to the first element of the first row. Defaults to `0`. |
| `stride?` | `number` | Byte distance between adjacent rows. Defaults to `ValueType.BYTES_PER_ELEMENT * size`. |
| `value?` | `TypedArray` | CPU-side data for the table. Required unless `source` is provided. |
| `source?` | `Operation \| GPUTable \| null` | Lazy data source for this table. |
| `isConstant?` | `boolean` | Whether every row shares the same value. Defaults to `false`. |
| `length?` | `number` | Row count. Optional when `isConstant` is `true` or `value` is provided. |

## Static Methods

### `GPUTable.fromArray(value, props?): GPUTable`

Creates a table from a typed array or numeric array. When passed a plain JavaScript array, the method creates a typed array using `props.type` or `'float32'` by default.

If `value` is a `Float64Array`, it is reinterpreted as `uint32` pairs so it can be used by GPU-oriented operations such as `fround()`.

### `GPUTable.fromConstant(value, type?): GPUTable`

Creates a constant table with one shared row value. A scalar becomes a one-element row, and an array becomes a row with `value.length` elements.

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

### `buffer`

GPU buffer for the table. Accessing this before `evaluate()` throws.

## Methods

### `constructor(props: GPUTableProps)`

Creates a table from explicit layout and source information.

### `evaluate(device: Device): Promise<void>`

Materializes the table on the provided device. If the table was created from an operation, all dependencies are evaluated first and the operation is executed lazily at this point.

### `readValue(startRow?: number, endRow?: number): Promise<TypedArray>`

Reads table contents back to the CPU. This is primarily for debugging or inspection and may be slower than staying on the GPU.

When rows are tightly packed, the returned typed array references a contiguous slice. For strided tables, the method copies each row into a compact array before returning it.

### `toString(): string`

Returns the debug id, source description, or class name.

### `destroy(): void`

Releases any cached GPU buffer and prevents future evaluation.

## Remarks

- `GPUTable` is immutable in shape. To produce a new table, create another `GPUTable` or use an operation that returns one.
- Evaluation is lazy. Creating operation chains does not allocate GPU resources until `evaluate()` is called on the output table.
- Constant tables are useful for broadcasting values across every row of a non-constant input.
