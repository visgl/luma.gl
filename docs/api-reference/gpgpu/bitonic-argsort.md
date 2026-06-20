import {GPGPUDocsTabs} from '@site/src/components/docs/gpgpu-docs-tabs';

# Bitonic Argsort

<GPGPUDocsTabs active="bitonic-argsort" />

`BitonicArgsort` is a WebGPU-only helper exported from `@luma.gl/gpgpu/webgpu`. It
sorts one packed `GPUVector<'uint32'>` of keys and returns a new
`GPUVector<'uint32'>` of source row indices in stable ascending key order.
Argsort returns row indices; it does not reorder or replace the input key vector.

Use this helper when the sorted row indices need to remain in GPU storage. It is
not a lazy `GPUDataEvaluator` operation and it is not available from the WebGL or
CPU endpoints. Arrow conversion remains in `@luma.gl/arrow`; the GPGPU helper
accepts the shared table-layer `GPUVector` type only.

## Arrow To GPUVector

```ts
import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {luma} from '@luma.gl/core';
import {BitonicArgsort} from '@luma.gl/gpgpu/webgpu';
import type {GPUVector} from '@luma.gl/tables';
import {webgpuAdapter} from '@luma.gl/webgpu';
import * as arrow from 'apache-arrow';

const device = await luma.createDevice({
  type: 'webgpu',
  adapters: [webgpuAdapter]
});
const sortKeyVector = arrow.vectorFromArray([13, 3, 8, 3, 10, 1], new arrow.Uint32());
const sortKeys = makeGPUVectorFromArrow(device, sortKeyVector, {
  name: 'sortKeys',
  format: 'uint32'
});
const sorter = new BitonicArgsort(device);
const sortedRowIndices: GPUVector<'uint32'> = sorter.sortGPUVector(sortKeys);

sortedRowIndices.destroy();
sortKeys.destroy();
sorter.destroy();
device.destroy();
```

The runnable [Bitonic argsort example](/examples/v10/gpgpu-bitonic-sort) builds an
Apache Arrow `Uint32` column, uploads it with `makeGPUVectorFromArrow(...)`, and
uses the returned GPU row-index vector as the real result while visualizing
bitonic passes locally for teaching.

## API

### `new BitonicArgsort(device)`

Creates one reusable sorter for a WebGPU device. The sorter owns internal scratch
buffers and releases them from `destroy()`.

### `sortGPUVector(keys)`

Returns source row indices ordered by ascending `uint32` key value. Equal keys
preserve source row order by comparing `(key, sourceRowIndex)` tuples.

`keys` must be one packed contiguous `GPUVector<'uint32'>` chunk with `uint32`
row storage on the sorter's device. Multi-chunk vectors are rejected instead of
being packed implicitly. Non-power-of-two row counts are padded internally with
invalid sentinels that sort after real rows.

The returned vector owns its output buffer and should be destroyed by the caller.
The input vector remains caller-owned and unchanged.

### `destroy()`

Releases scratch buffers owned by the sorter. Returned output vectors are
caller-owned and are not destroyed by the sorter.

## Input Contract

| Requirement | Behavior |
| --- | --- |
| Device | `keys` must belong to the same WebGPU device passed to the sorter. |
| Format | `keys.format` and its single `GPUData` chunk must be `uint32`. |
| Storage | The one input chunk must be packed, aligned `uint32` row storage covering every vector row. |
| Chunks | Exactly one contiguous input chunk is supported in v1. |
| Length | Zero rows are valid; lengths above `0x80000000` rows are rejected. |

## Ownership

- The sorter owns reusable internal scratch buffers only.
- The caller owns `keys` before and after sorting.
- Each call returns a new caller-owned `GPUVector<'uint32'>`.
- `destroy()` releases sorter scratch buffers but does not destroy prior outputs.
