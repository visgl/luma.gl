# GPUGeometry

`GPUGeometry` is the GPU-backed counterpart to [`Geometry`](/docs/api-reference/engine/geometry).
It stores already-created luma.gl `Buffer` objects plus the corresponding `bufferLayout` metadata.

Use it when geometry data is already on the GPU and should not be re-uploaded from typed arrays.

## Usage

```typescript
import {GPUGeometry} from '@luma.gl/engine';

const gpuGeometry = new GPUGeometry({
  topology: 'triangle-list',
  vertexCount: 3,
  bufferLayout: [{name: 'positions', format: 'float32x3'}],
  attributes: {
    positions: positionBuffer
  }
});
```

## Types

### `GPUGeometryProps`

```ts
export type GPUGeometryProps = {
  id?: string;
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  vertexCount: number;
  bufferLayout: BufferLayout[];
  indices?: Buffer | null;
  attributes: Record<string, Buffer>;
};
```

## Properties

### `id`, `topology`, `vertexCount`

Basic geometry identity and draw metadata.

### `bufferLayout`

The GPU buffer layout that matches the provided attributes.

### `indices`

Optional index buffer.

### `attributes`

Named vertex buffers.

### `userData`

Application-owned metadata.

## Methods

### `constructor(props: GPUGeometryProps)`

Creates a GPU-backed geometry object. Validates that `indices`, when present, has `Buffer.INDEX` usage.

### `destroy(): void`

Destroys the index buffer and all attribute buffers managed by this object.

### `getVertexCount(): number`

Returns the vertex count.

### `getAttributes(): Record<string, Buffer>`

Returns the attribute buffers.

### `getIndexes(): Buffer | null`

Returns the index buffer when present.

## Related Helpers

- `makeGPUGeometry(device, geometry)` converts a CPU `Geometry` into `GPUGeometry`.
- `getIndexBufferFromGeometry(device, geometry)` extracts or creates an index buffer.
- `getAttributeBuffersFromGeometry(device, geometry)` creates GPU attribute buffers and buffer layout metadata.
