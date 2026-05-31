# GPUVector

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUVector` represents one logical typed table column over one or more
[`GPUData`](/docs/api-reference/tables/gpu-data) chunks. It does not own a
buffer directly; every concrete buffer lives on a `GPUData` object in
`GPUVector.data[]`.

## Usage

```ts
import {GPUVector} from '@luma.gl/tables';

const gpuVector = new GPUVector({
  type: 'buffer',
  name: 'positions',
  buffer,
  format: 'float32x3',
  length,
  byteStride: 12
});

gpuVector.data[0].buffer; // the bindable storage
```

When the input starts as Apache Arrow, prefer
[`makeGPUVectorFromArrow()`](/docs/api-reference/arrow/supported-arrow-types) from
`@luma.gl/arrow`.

## Constructor Modes

`GPUVector` uses a discriminated constructor prop union.

| Mode | Key props | Use when |
| --- | --- | --- |
| `{type: 'buffer'}` | `name`, `buffer`, `format`, `length` | Wrap one existing typed GPU buffer as one `GPUData` chunk. |
| `{type: 'interleaved'}` | `name`, `buffer`, `byteStride`, `attributes` | Wrap one existing interleaved row buffer as one `GPUData` chunk plus a `BufferLayout`. |
| `{type: 'data'}` | `name`, `format`, `data[]` | Expose existing `GPUData` chunks as one logical column. |
| `{type: 'appendable'}` | `name`, `device`, `format`, `byteStride` | Create an initially empty logical vector that adapter code can append to with new `GPUData` chunks. |

## Properties

| Property | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Stable vector/table column name. |
| `format` | `GPUVectorFormat \| undefined` | Canonical memory-layout descriptor for uploaded bytes. |
| `type` | `unknown` | Deprecated adapter-owned logical metadata. |
| `dataType` | `unknown` | Deprecated adapter-owned logical metadata. |
| `length` | `number` | Aggregate logical row count. |
| `valueLength` | `number` | Aggregate fixed-row or flattened vertex-list element count. |
| `stride` | `number` | Number of scalar values represented by one fixed row or flattened element. |
| `byteOffset` | `number` | Compatibility metadata for the first row when this vector has one chunk. |
| `byteStride` | `number` | Bytes between adjacent fixed rows or flattened elements. |
| `rowByteLength` | `number` | Bytes occupied by one fixed row or flattened element payload. |
| `bufferLayout` | `BufferLayout \| undefined` | Interleaved buffer layout, when this vector describes multiple attribute views. |
| `data` | `GPUData[]` | Ordered chunks that define the logical column. Each chunk has its own buffer. |
| `ownsBuffer` | `boolean` | Whether destroying this vector releases retained GPU storage. |
| `capacityRows` | `number \| undefined` | Current logical rows for appendable vectors. |
| `appendedByteLength` | `number` | Adapter-reported bytes occupied by appended chunks. |

## Methods

### `addData(data): this`

Adds an existing `GPUData` chunk to this logical vector. The chunk must have the
same `format`, `byteStride`, and `rowByteLength`.

### `appendDataChunk(data, appendedByteLength): this`

Adds one adapter-created `GPUData` chunk to an appendable logical vector.

### `resetLastBatch(): this`

Clears appendable logical rows and destroys appended `GPUData` buffers.

### `transferBufferOwnership(target): void`

Transfers same-buffer ownership between two single-chunk vector views. This is a
migration helper for adapters that create short-lived views.

### `destroy(): void`

Destroys owned `GPUData` chunks and retained detached vectors. Borrowed storage
is left alive.

## Notes

Use `data[]` for binding, copying, batching, and ownership. A single-buffer
consumer should explicitly require `vector.data.length === 1` and then bind
`vector.data[0].buffer`.

For `vertex-list<...>` vectors, `length` remains the source row count and
`valueLength` is the flattened element count. `byteStride` and `rowByteLength`
describe one flattened element, not one source row. Offsets and other
variable-length metadata are adapter-owned.
