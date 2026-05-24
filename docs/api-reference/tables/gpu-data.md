# GPUData

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUData` describes one typed GPU memory range. It is the lowest-level table
object in `@luma.gl/tables` and is intentionally format-agnostic: Arrow,
generated geometry, or other producers can attach their own readback metadata
without changing the ownership model.

## Usage

```ts
import {GPUData} from '@luma.gl/tables';

const gpuData = new GPUData({
  buffer: dynamicBuffer,
  dataType,
  length,
  byteStride,
  ownsBuffer: false
});
```

When the input starts as Apache Arrow, prefer
[`makeArrowGPUData()`](/docs/api-reference/arrow/supported-arrow-types) from
`@luma.gl/arrow`; it uploads Arrow buffers and fills in the required layout and
readback metadata.

## Constructor

### `new GPUData(props)`

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `buffer` | `DynamicBuffer` | Required | Stable GPU buffer wrapper for this data range. |
| `dataType` | `arrow.DataType` | Required | Logical schema/type descriptor for the bytes. |
| `length` | `number` | Required | Number of logical rows in this chunk. |
| `stride` | `number` | `1` | Number of scalar values represented by one logical row. |
| `byteOffset` | `number` | `0` | Byte offset of the first logical row in `buffer`. |
| `byteStride` | `number` | Required | Bytes between adjacent logical rows. |
| `rowByteLength` | `number` | `byteStride` | Bytes occupied by one logical row payload. |
| `ownsBuffer` | `boolean` | `false` | Whether `destroy()` releases the backing `DynamicBuffer`. |
| `readbackMetadata` | `unknown` | `undefined` | Producer-owned metadata retained for adapter-level readback. |

## Properties

| Property | Type | Meaning |
| --- | --- | --- |
| `buffer` | `DynamicBuffer` | GPU buffer containing this chunk's bytes. |
| `type` | `arrow.DataType` | Logical schema/type descriptor for the bytes. |
| `length` | `number` | Number of logical rows in this chunk. |
| `stride` | `number` | Number of scalar values represented by one logical row. |
| `byteOffset` | `number` | Byte offset of the first logical row. |
| `byteStride` | `number` | Bytes between adjacent logical rows. |
| `rowByteLength` | `number` | Bytes occupied by one logical row payload. |
| `readbackMetadata` | `unknown` | Optional producer-owned metadata. |
| `ownsBuffer` | `boolean` | Whether this data range currently owns its backing buffer. |

## Methods

### `destroy(): void`

Destroys the backing `DynamicBuffer` only when `ownsBuffer` is true. Borrowed
buffers are left alive.

## Ownership

`GPUData` is the storage-owning layer. `GPUVector`, `GPURecordBatch`, and
`GPUTable` follow their ownership graph down to `GPUData`, but buffer destruction
is controlled here.
