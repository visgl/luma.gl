# GPUData

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUData` describes one GPU buffer plus typed row metadata. It is the
lowest-level storage object in `@luma.gl/tables`: each `GPUData` owns or borrows
its own `Buffer` or `DynamicBuffer`, and higher-level table objects refer to
buffers through `GPUData`.

## Usage

```ts
import {GPUData} from '@luma.gl/tables';

const gpuData = new GPUData({
  buffer,
  format: 'float32x3',
  length,
  byteStride: 12,
  ownsBuffer: true
});
```

When the input starts as Apache Arrow, prefer
[`makeArrowGPUData()`](/docs/api-reference/arrow/supported-arrow-types) from
`@luma.gl/arrow`; it uploads Arrow values into GPU buffers and fills in the
required format, layout, and readback metadata.

## Constructor

### `new GPUData(props)`

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `buffer` | `Buffer \| DynamicBuffer` | Required | GPU buffer containing this chunk's bytes. |
| `format` | `GPUVectorFormat` | `undefined` | Canonical memory-layout descriptor, such as `float32x3` or `vertex-list<float32x3>`. |
| `length` | `number` | Required | Number of logical rows in this chunk. |
| `valueLength` | `number` | `length` | Number of fixed rows or flattened vertex-list element values. |
| `stride` | `number` | Derived from `format` | Number of scalar values represented by one fixed row or flattened element. |
| `byteOffset` | `number` | `0` | Byte offset of the first logical row in this chunk's buffer. Most adapters use `0` because chunks own their uploaded buffers. |
| `byteStride` | `number` | Derived from `format` | Bytes between adjacent fixed rows or flattened elements. |
| `rowByteLength` | `number` | Derived from `format` | Bytes occupied by one fixed row or flattened element payload. |
| `ownsBuffer` | `boolean` | `false` | Whether `destroy()` releases the backing buffer. |
| `readbackMetadata` | `unknown` | `undefined` | Producer-owned metadata retained for adapter-level readback. |
| `dataType` | `unknown` | `undefined` | Deprecated adapter-owned logical metadata retained during migration. |

## Properties

| Property | Type | Meaning |
| --- | --- | --- |
| `buffer` | `Buffer \| DynamicBuffer` | GPU buffer containing this chunk's bytes. |
| `format` | `GPUVectorFormat \| undefined` | Canonical memory-layout descriptor when this chunk has one value view. |
| `type` | `unknown` | Deprecated adapter-owned logical metadata. |
| `dataType` | `unknown` | Deprecated adapter-owned logical metadata. |
| `length` | `number` | Number of logical rows in this chunk. |
| `valueLength` | `number` | Number of fixed rows or flattened vertex-list element values. |
| `stride` | `number` | Number of scalar values represented by one fixed row or flattened element. |
| `byteOffset` | `number` | Byte offset of the first logical row. |
| `byteStride` | `number` | Bytes between adjacent fixed rows or flattened elements. |
| `rowByteLength` | `number` | Bytes occupied by one fixed row or flattened element payload. |
| `readbackMetadata` | `unknown` | Optional producer-owned metadata. |
| `ownsBuffer` | `boolean` | Whether this data range currently owns its backing buffer. |

## Methods

### `destroy(): void`

Destroys the backing buffer only when `ownsBuffer` is true. Borrowed buffers are
left alive.

## Ownership

`GPUData` is the storage-owning layer. `GPUVector`, `GPURecordBatch`, and
`GPUTable` follow their ownership graph down to `GPUData`, but buffer destruction
is controlled here.

`GPUData` should not be used as a cheap view into a larger aggregate table
buffer. If a streaming adapter receives a new source batch, it should create new
`GPUData` objects with their own buffers and append those chunks to a
`GPUVector`.
