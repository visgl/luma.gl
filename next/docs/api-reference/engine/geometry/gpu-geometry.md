# GPUGeometry

[Geometry](https://luma.gl/next/docs/api-reference/engine/geometry.md)[GPUGeometry](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md)[Built-ins](https://luma.gl/next/docs/api-reference/engine/geometry/geometries.md)

`GPUGeometry` is the GPU-backed counterpart to [`Geometry`](https://luma.gl/next/docs/api-reference/engine/geometry.md). It stores already-created luma.gl `Buffer` objects plus the corresponding `bufferLayout` metadata.

Use it when geometry data is already on the GPU and should not be re-uploaded from typed arrays. When CPU `Geometry` is converted through `makeGPUGeometry()`, it is first interleaved so the upload uses one vertex buffer plus an optional index buffer.

## Usage[​](#usage "Direct link to Usage")

```
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

## Types[​](#types "Direct link to Types")

### `GPUGeometryProps`[​](#gpugeometryprops "Direct link to gpugeometryprops")

```
export type GPUGeometryProps = {
  id?: string;
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  vertexCount: number;
  bufferLayout: BufferLayout[];
  indices?: Buffer | null;
  attributes: Record<string, Buffer>;
};
```

## Properties[​](#properties "Direct link to Properties")

### `id`, `topology`, `vertexCount`[​](#id-topology-vertexcount "Direct link to id-topology-vertexcount")

Basic geometry identity and draw metadata.

### `bufferLayout`[​](#bufferlayout "Direct link to bufferlayout")

The GPU buffer layout that matches the provided attributes.

### `indices`[​](#indices "Direct link to indices")

Optional index buffer.

### `attributes`[​](#attributes "Direct link to attributes")

Named vertex buffers. Keys match `bufferLayout[].name`; these are GPU buffer binding names, not necessarily the source keys stored in CPU `Geometry.attributes`.

### `userData`[​](#userdata "Direct link to userdata")

Application-owned metadata.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props: GPUGeometryProps)`[​](#constructorprops-gpugeometryprops "Direct link to constructorprops-gpugeometryprops")

Creates a GPU-backed geometry object. Validates that `indices`, when present, has `Buffer.INDEX` usage.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys the index buffer and all attribute buffers managed by this object.

### `getVertexCount(): number`[​](#getvertexcount-number "Direct link to getvertexcount-number")

Returns the vertex count.

### `getAttributes(): Record<string, Buffer>`[​](#getattributes-recordstring-buffer "Direct link to getattributes-recordstring-buffer")

Returns the attribute buffers.

### `getIndexes(): Buffer | null`[​](#getindexes-buffer--null "Direct link to getindexes-buffer--null")

Returns the index buffer when present.

## Related Helpers[​](#related-helpers "Direct link to Related Helpers")

* `makeGPUGeometry(device, geometry)` converts a CPU `Geometry` into `GPUGeometry`. CPU input is interleaved before upload; `GPUGeometry` input is returned unchanged.
* `getIndexBufferFromGeometry(device, geometry)` extracts or creates an index buffer.
* `getAttributeBuffersFromGeometry(device, geometry)` creates one GPU vertex buffer per CPU geometry attribute key and preserves the geometry's `bufferLayout`.
