# Geometry

[Geometry](https://luma.gl/next/docs/api-reference/engine/geometry.md)[GPUGeometry](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md)[Built-ins](https://luma.gl/next/docs/api-reference/engine/geometry/geometries.md)

`Geometry` is the CPU-side geometry container used by engine classes. It stores typed-array attributes, optional indices, and a `bufferLayout`. When a layout is not supplied, `Geometry` creates a one-buffer-per-attribute layout automatically. Use `makeInterleavedGeometry()` to pack multiple CPU attributes into one vertex buffer while still representing the result as a normal `Geometry`.

## Usage[​](#usage "Direct link to Usage")

```
import {Geometry} from '@luma.gl/engine';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}
  }
});
```

## Types[​](#types "Direct link to Types")

### `GeometryProps`[​](#geometryprops "Direct link to geometryprops")

```
export type GeometryProps = {
  id?: string;
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  vertexCount?: number;
  attributes: Record<string, GeometryAttributeInput>;
  bufferLayout?: BufferLayout[];
  indices?: GeometryAttribute | TypedArray;
};
```

### `GeometryAttributeInput`[​](#geometryattributeinput "Direct link to geometryattributeinput")

```
export type GeometryAttributeInput = GeometryAttribute | TypedArray;
```

### `GeometryAttribute`[​](#geometryattribute "Direct link to geometryattribute")

```
export type GeometryAttribute = {
  size?: number;
  value: TypedArray;
  [key: string]: any;
};
```

## Properties[​](#properties "Direct link to Properties")

### `id`[​](#id "Direct link to id")

Application-provided identifier.

### `topology`[​](#topology "Direct link to topology")

Primitive topology used by consumers of the geometry.

### `vertexCount`[​](#vertexcount "Direct link to vertexcount")

Explicit or auto-calculated vertex count.

### `indices`[​](#indices "Direct link to indices")

Optional index attribute.

### `attributes`[​](#attributes "Direct link to attributes")

Named CPU geometry attributes. `Geometry` preserves the keys supplied to the constructor. Built-in geometries and `@luma.gl/gltf` use glTF mesh attribute semantics such as `POSITION`, `NORMAL`, and `TEXCOORD_0`; glTF calls these mesh attribute semantics, while each semantic points to accessor data in `mesh.primitive.attributes`. See the official [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

Shader-facing names are separate. Synthesized buffer layouts map supported semantic names at the render boundary: `POSITION` becomes `positions`, `NORMAL` becomes `normals`, `TEXCOORD_0` becomes `texCoords`, `TEXCOORD_1` becomes `texCoords1`, and `COLOR_0` becomes `colors`. Caller-provided non-glTF names such as `positions`, `clipSpacePositions`, and `faceIndex` are preserved as-is. When writing glTF custom semantics, use the spec's `_NAME` convention. If constructor input contains both a semantic key and its supported shader-facing name, the later key wins so built-in geometry attribute overrides keep their legacy behavior without storing duplicate CPU aliases.

For non-interleaved geometry, each attribute key normally names one typed-array attribute. For interleaved geometry, the attribute key names the packed buffer, and `bufferLayout` maps that buffer back to shader attributes.

### `bufferLayout`[​](#bufferlayout "Direct link to bufferlayout")

The buffer layout for the geometry attributes. It is always populated on constructed `Geometry` instances. If omitted, the constructor creates one shader-facing layout entry for each attribute. Explicit `bufferLayout` entries are preserved unchanged.

### `userData`[​](#userdata "Direct link to userdata")

Application-owned metadata.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props: GeometryProps)`[​](#constructorprops-geometryprops "Direct link to constructorprops-geometryprops")

Creates a geometry object and wraps raw typed arrays into `GeometryAttribute` records.

### `getVertexCount(): number`[​](#getvertexcount-number "Direct link to getvertexcount-number")

Returns the resolved vertex count.

### `getAttributes(): GeometryAttributes`[​](#getattributes-geometryattributes "Direct link to getattributes-geometryattributes")

Returns the geometry attributes, including `indices` when present.

### `makeInterleavedGeometry(geometry, options?): Geometry`[​](#makeinterleavedgeometrygeometry-options-geometry "Direct link to makeinterleavedgeometrygeometry-options-geometry")

Packs non-index geometry attributes into one typed-array-backed buffer and returns a normal `Geometry`. The returned geometry has one attribute, named `geometry` by default, and a multi-attribute `bufferLayout`.

```
import {Geometry, makeInterleavedGeometry} from '@luma.gl/engine';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
    TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0, 1])}
  }
});

const interleavedGeometry = makeInterleavedGeometry(geometry);

interleavedGeometry.attributes.geometry; // packed Uint8Array
interleavedGeometry.bufferLayout; // maps positions and texCoords into the packed buffer
```

Calling `makeInterleavedGeometry()` on an already interleaved geometry with the same buffer name is idempotent and returns the original instance.

## Remarks[​](#remarks "Direct link to Remarks")

* `POSITION` or `positions` defaults to `size: 3` when the size is omitted.
* `bufferLayout` is synthesized when omitted.
* `makeGPUGeometry()` interleaves CPU `Geometry` before uploading it to GPU buffers.
* Use [`GPUGeometry`](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md) when geometry data is already uploaded into GPU buffers.
