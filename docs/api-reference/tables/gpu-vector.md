# GPUVector

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUVector` represents one logical typed table column over one or more
[`GPUData`](/docs/api-reference/tables/gpu-data) chunks. It can wrap an existing
GPU buffer, describe an interleaved buffer, aggregate existing chunks, or create
appendable `DynamicBuffer` storage.

## Usage

```ts
import {GPUVector} from '@luma.gl/tables';

const gpuVector = new GPUVector({
  type: 'buffer',
  name: 'positions',
  buffer,
  dataType,
  length,
  byteStride
});
```

When the input starts as Apache Arrow, prefer
[`makeArrowGPUVector()`](/docs/api-reference/arrow/supported-arrow-types) from
`@luma.gl/arrow`.

## Constructor Modes

`GPUVector` uses a discriminated constructor prop union.

| Mode | Key props | Use when |
| --- | --- | --- |
| `{type: 'buffer'}` | `name`, `buffer`, `dataType`, `length`, `byteStride` | One typed column is stored in one existing GPU buffer. |
| `{type: 'interleaved'}` | `name`, `buffer`, `dataType`, `length`, `byteStride`, `attributes` | One GPU buffer contains several attribute views per row. |
| `{type: 'data'}` | `name`, `dataType`, `data[]` | Existing `GPUData` chunks should be exposed as one logical column. |
| `{type: 'appendable'}` | `name`, `device`, `dataType`, `stride`, `byteStride` | The vector should own growable `DynamicBuffer` storage for later append writes. |

## Properties

| Property | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Stable vector/table column name. |
| `type` | `arrow.DataType` | Logical schema/type descriptor. |
| `length` | `number` | Aggregate logical row count. |
| `stride` | `number` | Number of scalar values represented by one row. |
| `byteOffset` | `number` | Byte offset of the first row when a direct backing surface exists. |
| `byteStride` | `number` | Bytes between adjacent logical rows. |
| `rowByteLength` | `number` | Bytes occupied by one row payload. |
| `bufferLayout` | `BufferLayout \| undefined` | Interleaved buffer layout, when this vector describes multiple attribute views. |
| `data` | `GPUData[]` | Ordered chunk views that define the logical column. |
| `buffer` | `Buffer \| DynamicBuffer` | Directly bindable buffer; throws for multi-buffer aggregate vectors. |
| `ownsBuffer` | `boolean` | Whether destroying this vector releases retained GPU storage. |
| `capacityRows` | `number \| undefined` | Appendable row capacity when backed by `DynamicBuffer`. |
| `appendedByteLength` | `number` | Bytes occupied by appendable payloads. |

## Methods

### `addData(data): this`

Adds an existing `GPUData` chunk to this logical vector. The chunk must have the
same logical type, `byteStride`, and `rowByteLength`.

### `writeAppendableBytes(data, byteOffset, requiredByteLength): void`

Reserves appendable storage and writes raw bytes supplied by a format-specific
adapter. This requires the vector to be appendable.

### `appendDataChunk(data, appendedByteLength): this`

Adds one appendable `GPUData` view while preserving the concrete appendable
backing buffer.

### `resetLastBatch(): this`

Clears appendable logical rows while retaining the `DynamicBuffer` allocation.

### `transferBufferOwnership(target): void`

Transfers same-buffer ownership to another vector view. Both vectors must refer
to the same concrete buffer.

### `destroy(): void`

Releases owned concrete buffers, retained detached vectors, and owned data
chunks. Borrowed storage is left alive.

## Notes

Use `data[]` for batch-aware code. The `buffer` convenience accessor is only
available when the vector has exactly one concrete backing surface.
