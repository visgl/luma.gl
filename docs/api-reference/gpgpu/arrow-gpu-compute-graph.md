# evaluateGPUComputeGraph

`evaluateGPUComputeGraph()` evaluates lazy operation trees over GPU-resident `ArrowGPUVector`s.

The function infers the device from input vectors. Operation tree nodes are created separately with factories such as `arrowUpload()`, `arrowAdd()`, `arrowInterleave()`, `arrowDeinterleave()`, `arrowSegment()`, `arrowDesegment()`, `arrowFround()`, and `arrowProjectWGS84ToPseudoMercator()`, or with explicit operation classes.

## Usage

```ts
import {ArrowGPUVector} from '@luma.gl/arrow';
import {arrowAdd, evaluateGPUComputeGraph} from '@luma.gl/gpgpu';
import * as arrow from 'apache-arrow';

const x = new ArrowGPUVector({
  type: 'arrow',
  name: 'x',
  device,
  vector: arrow.makeVector(new Float32Array([0, 1, 2, 3]))
});

const y = new ArrowGPUVector({
  type: 'arrow',
  name: 'y',
  device,
  vector: arrow.makeVector(new Float32Array([10, 20, 30, 40]))
});

const result = evaluateGPUComputeGraph(arrowAdd(x, y, {name: 'sum'}));
```

Arrow vectors or table columns can be uploaded as source nodes:

```ts
const result = evaluateGPUComputeGraph(
  arrowAdd(
    arrowUpload(table, 'positions', {name: 'positions'}),
    arrowUpload(offsets, {name: 'offsets'})
  ),
  device
);
```

When an operation tree starts from CPU Arrow data, pass `device` explicitly because there is no existing GPU vector to infer from.

Operation trees can be nested before evaluation:

```ts
const sum = arrowAdd(x, y, {name: 'sum'});
const packed = arrowInterleave([sum, x], {
  name: 'sum_positions',
  attributes: ['sum', 'positions']
});

const result = evaluateGPUComputeGraph(packed);
```

Interleaved vectors can be unpacked by attribute name:

```ts
const packedPositions = evaluateGPUComputeGraph(
  arrowDeinterleave(packed, 'positions', {name: 'positions'})
);
```

Packed vectors can be grouped into one segmented allocation and copied back out by segment name:

```ts
const segmented = evaluateGPUComputeGraph(
  arrowSegment([positions, weights], {name: 'segments', segments: ['positions', 'weights']})
);

const weightsPacked = evaluateGPUComputeGraph(
  arrowDesegment(segmented, 'weights', {name: 'weights'})
);
```

WGS84 longitude/latitude values can be projected to EPSG:3857 pseudo-Mercator after `arrowFround()` converts `Float64` coordinates to double-single `Float32` pairs:

```ts
import {arrowFround, arrowProjectWGS84ToPseudoMercator} from '@luma.gl/gpgpu';

const projected = evaluateGPUComputeGraph(
  arrowProjectWGS84ToPseudoMercator(arrowFround(lonLat64), {name: 'xy3857'})
);
```

The projection input and output row layout is `[xHigh, yHigh, xLow, yLow]`.

Explicit operation classes are also supported when an application wants inspectable nodes:

```ts
import {ArrowAddOperation, evaluateGPUComputeGraph} from '@luma.gl/gpgpu';

const sum = new ArrowAddOperation({
  parameters: {x, y},
  props: {name: 'sum'}
});

const result = evaluateGPUComputeGraph(sum);
```

## Functions

### `evaluateGPUComputeGraph(input, device?): ArrowGPUVector`

Evaluates an `ArrowGPUVector` or an `ArrowGPUOperationNode`.

- If `input` is an `ArrowGPUVector`, it is returned unchanged.
- If `device` is omitted, it is inferred from input vectors in the operation tree.
- All input vectors must use the same device.
- A `device` can be supplied explicitly when the operation tree should be validated against a known device.

## Operation Factories

### `arrowUpload(vector, props?)`

Creates an `ArrowUploadOperation` node from an Arrow vector.

### `arrowUpload(table, path, props?)`

Creates an `ArrowUploadOperation` node from a dot-separated Arrow table column path.

`arrowUpload()` uploads CPU Arrow data during graph evaluation and returns an owned `ArrowGPUVector`. If no other GPU input exists in the tree, `evaluateGPUComputeGraph()` requires an explicit device.

### `arrowAdd(x, y, props?)`

Creates an `ArrowAddOperation` node.

### `arrowInterleave(inputs, props?)`

Creates an `ArrowInterleaveOperation` node.

### `arrowDeinterleave(source, attribute, props?)`

Creates an `ArrowDeinterleaveOperation` node.

The input must be an interleaved `ArrowGPUVector<Binary>` with `bufferLayout.attributes` metadata. The v1 implementation extracts one 32-bit attribute format such as `float32`, `float32x2`, `float32x3`, `float32x4`, `uint32`, or `sint32` into a packed output vector.

### `arrowSegment(inputs, props?)`

Creates an `ArrowSegmentOperation` node.

The input vectors must be packed numeric `ArrowGPUVector`s with the same row count. The result is an `ArrowGPUVector<Binary>` with `segmentedBufferLayout` metadata. Segment byte offsets are 256-byte aligned, and each segment remains column-major and contiguous.

### `arrowDesegment(source, segment, props?)`

Creates an `ArrowDesegmentOperation` node.

The input must be a segmented `ArrowGPUVector<Binary>` with `segmentedBufferLayout` metadata. The operation copies one named segment into a new owned packed `ArrowGPUVector`.

### `arrowFround(x, props?)`

Creates an `ArrowFroundOperation` node.

### `arrowProjectWGS84ToPseudoMercator(x, props?)`

Creates an `ArrowProjectWGS84ToPseudoMercatorOperation` node.

The input must be a `FixedSizeList<Float32, 4>` vector produced from WGS84 `Float64` longitude/latitude pairs by `arrowFround()`. The operation returns a `FixedSizeList<Float32, 4>` vector containing EPSG:3857 pseudo-Mercator meters in double-single layout.

## Operation Classes

- `ArrowAddOperation`
- `ArrowUploadOperation`
- `ArrowInterleaveOperation`
- `ArrowDeinterleaveOperation`
- `ArrowSegmentOperation`
- `ArrowDesegmentOperation`
- `ArrowFroundOperation`
- `ArrowProjectWGS84ToPseudoMercatorOperation`
- `ArrowGPUOperationNode`

Each concrete operation class accepts `{parameters, props}`.

## Ownership

Arrow GPGPU operations are out-of-place in v1. Inputs are not mutated or destroyed. Returned `ArrowGPUVector`s own generated GPU buffers.
