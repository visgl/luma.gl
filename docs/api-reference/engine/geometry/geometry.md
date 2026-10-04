import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# Geometry

<EngineDocsTabs group="geometry" active="geometry" />

`Geometry` is the CPU-side geometry container used by engine classes.
It stores typed-array attributes, optional indices, and a `bufferLayout`.
When a layout is not supplied, `Geometry` creates a one-buffer-per-attribute layout automatically.
Use `makeInterleavedGeometry()` to pack multiple CPU attributes into one vertex buffer while still
representing the result as a normal `Geometry`.

<DocumentationContract title="Geometry" rows={[
  {label: 'Role', value: 'CPU-side attributes, indices, topology, and buffer layout'},
  {label: 'Construction', value: 'GeometryProps with typed arrays or explicit attributes'},
  {label: 'Updates', value: 'Create a new Geometry or update uploaded Model buffers'},
  {label: 'Ownership', value: 'Owns CPU arrays; the consuming Model owns uploaded internal buffers'},
  {label: 'Portability', value: 'Preserves source semantics and maps them at the rendering boundary'},
  {label: 'Performance', value: 'Interleave explicitly when fewer GPU buffers improve the workload'}
]} />

## Usage

```typescript
import {Geometry} from '@luma.gl/engine';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}
  }
});
```

## Types

### `GeometryProps`

```ts
export type GeometryProps = {
  id?: string;
  topology: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  vertexCount?: number;
  attributes: Record<string, GeometryAttributeInput>;
  bufferLayout?: BufferLayout[];
  indices?: GeometryAttribute | TypedArray;
};
```

### `GeometryAttributeInput`

```ts
export type GeometryAttributeInput = GeometryAttribute | TypedArray;
```

### `GeometryAttribute`

```ts
export type GeometryAttribute = {
  size?: number;
  value: TypedArray;
  [key: string]: any;
};
```

## Properties

### `id`

Application-provided identifier.

### `topology`

Primitive topology used by consumers of the geometry.

### `vertexCount`

Explicit or auto-calculated vertex count.

### `indices`

Optional index attribute.

### `attributes`

Named CPU geometry attributes. `Geometry` preserves the keys supplied to the constructor. Built-in
geometries and `@luma.gl/gltf` use glTF mesh attribute semantics such as `POSITION`, `NORMAL`, and
`TEXCOORD_0`; glTF calls these mesh attribute semantics, while each semantic points to accessor data in
`mesh.primitive.attributes`. See the official [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

Shader-facing names are separate. Synthesized buffer layouts map supported semantic names at the render
boundary: `POSITION` becomes `positions`, `NORMAL` becomes `normals`, `TEXCOORD_0` becomes `texCoords`,
`TEXCOORD_1` becomes `texCoords1`, and `COLOR_0` becomes `colors`. Caller-provided non-glTF names such as
`positions`, `clipSpacePositions`, and `faceIndex` are preserved as-is. When writing glTF custom semantics,
use the spec's `_NAME` convention. If constructor input contains both a semantic key and its supported
shader-facing name, the later key wins so built-in geometry attribute overrides keep their legacy behavior
without storing duplicate CPU aliases.

For non-interleaved geometry, each attribute key normally names one typed-array attribute. For interleaved
geometry, the attribute key names the packed buffer, and `bufferLayout` maps that buffer back to shader
attributes.

### `bufferLayout`

The buffer layout for the geometry attributes. It is always populated on constructed `Geometry` instances.
If omitted, the constructor creates one shader-facing layout entry for each attribute. Explicit
`bufferLayout` entries are preserved unchanged.

### `userData`

Application-owned metadata.

## Methods

### `constructor(props: GeometryProps)`

Creates a geometry object and wraps raw typed arrays into `GeometryAttribute` records.

### `getVertexCount(): number`

Returns the resolved vertex count.

### `getAttributes(): GeometryAttributes`

Returns the geometry attributes, including `indices` when present.

### `makeInterleavedGeometry(geometry, options?): Geometry`

Packs non-index geometry attributes into one typed-array-backed buffer and returns a normal `Geometry`.
The returned geometry has one attribute, named `geometry` by default, and a multi-attribute `bufferLayout`.

```typescript
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

Calling `makeInterleavedGeometry()` on an already interleaved geometry with the same buffer name is idempotent
and returns the original instance.

## Remarks

- `POSITION` or `positions` defaults to `size: 3` when the size is omitted.
- `bufferLayout` is synthesized when omitted.
- `makeGPUGeometry()` interleaves CPU `Geometry` before uploading it to GPU buffers.
- Use [`GPUGeometry`](/docs/api-reference/engine/geometry/gpu-geometry) when geometry data is already uploaded into GPU buffers.

## Extracting architectural edges

`makeEdgeGeometry(geometry, options?)` creates an indexed `line-list` geometry containing open
boundaries and creases between adjacent triangle faces. It removes coplanar triangulation
edges, welds duplicate positions across attribute seams, ignores duplicate and degenerate
triangles, and retains edges shared by more than two faces.

```typescript
import {CubeGeometry, makeEdgeGeometry} from '@luma.gl/engine';

const surface = new CubeGeometry();
const edges = makeEdgeGeometry(surface, {angleThreshold: 30});
// Twelve cuboid edges, without face diagonals or duplicated seam edges.
```

Options:

- `includeCoplanarEdges`: retain triangulation edges as well as architectural edges, default false.
- `angleThreshold`: minimum dihedral angle in degrees (0–180), default 30. Coplanar internal
  edges are omitted even at zero. Adjacent triangles should have consistent winding.
- `weldTolerance`: nonnegative position distance in source coordinate units, default zero for
  exact welding. Positive values also merge nearby vertices across spatial bucket boundaries.
- `positionAttribute`: CPU position attribute name, default `POSITION`. Set it explicitly for
  legacy or custom attribute names. The name is preserved in the returned geometry.

Input must be an indexed or non-indexed `triangle-list` with a packed three-component position
attribute. Only the active `vertexCount` is inspected. Interleaved or GPU-only input must first
be converted to packed CPU positions. The result borrows the source position attribute and owns
new `Uint32Array` indices; it neither mutates the source nor copies unrelated attributes.

This is CPU preprocessing for static mesh edges. Run it when geometry changes, rather than every
frame. It does not compute view-dependent silhouettes or connect segments into joined paths. Render opaque surfaces before an edge
overlay to provide hidden-edge occlusion; stroke width and material are renderer concerns.


### Adjacent meshes and tile boundaries

`makeEdgeGeometryFromGeometries(geometries, options?)` explicitly batches CPU meshes before
running the same edge classifier. Shared coplanar edges disappear, while a crease between
meshes is emitted once. Separately extracting each tile cannot distinguish a tile seam from
an open boundary.

```typescript
import {makeEdgeGeometryFromGeometries} from '@luma.gl/engine';

const edges = makeEdgeGeometryFromGeometries(loadedTileGeometries, {
  angleThreshold: 30,
  weldTolerance: 0.001
});
```

Provide a nonempty batch with positions in one common coordinate frame and the same position
attribute name, typed-array constructor, and normalization setting. Coordinates are copied
without changing their scalar type. The result owns new position and index arrays; source
geometries and their draw ranges remain unchanged. Other attributes are not copied.

The caller chooses the batch and recomputes it when tiles arrive, leave, or change. Render the
batch output once, not once per tile. A missing neighbor remains an open boundary. Matching
edge endpoints and consistent face winding are required: this helper does not split T-junctions,
reconcile mixed levels of detail, transform tile coordinates, or remove skirts. Positive weld
tolerance can reconcile small coordinate differences but can also merge nearby distinct edges.
