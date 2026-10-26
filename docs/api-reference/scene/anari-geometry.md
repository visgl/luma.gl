import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# ANARI Arrays and Geometry

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

`ANARIArray` describes shared application data, and `ANARIGeometry` describes one reusable geometric primitive. Geometry becomes visible when paired with a material in an [`ANARISurface`](/docs/api-reference/scene/anari-scene).

## `ANARIArray`

```ts
new ANARIArray(device: ANARIDevice, parameters: ANARIArrayParameters);
```

Applications normally call the equivalent `anariDevice.newArray(parameters)` factory:

```ts
const positions = new Float32Array([
  -1, 0, 0,
   1, 0, 0,
   0, 1, 0
]);

const positionArray = anariDevice.newArray({
  data: positions,
  elementType: 'float32x3',
  dimensions: [3]
});
```

### Parameters

```ts
type ANARIArrayParameters = {
  data: ANARIArrayData;
  elementType?: string;
  dimensions?: readonly number[];
};

type ANARIArrayData = TypedArray | readonly ANARIObjectReference[];
```

| Parameter | Required | Meaning |
| --- | --- | --- |
| `data` | Yes | A typed array or an array of retained ANARI object references. |
| `elementType` | No | Application-provided element metadata, for example `float32x3`. |
| `dimensions` | No | Application-provided dimension metadata. |

The current implementation preserves the original typed array without copying. `elementType` and `dimensions` are retained metadata; the renderer does not currently validate or reinterpret them.

### Properties

```ts
array.data: ANARIArrayData;
array.length: number;
```

`length` is the JavaScript `data.length`. For `new Float32Array(9)`, the result is `9` scalar values, not three vector elements. For an object-reference array, it is the number of objects.

Mutating the original typed array mutates the retained storage:

```ts
positions[0] = -2;
positionArray.data === positions; // true
```

When geometry data changes after its first render, commit the owning geometry so its cached GPU representation is rebuilt:

```ts
positions[0] = -2;
geometry.commitParameters();
```

### Object-reference arrays

```ts
const surfaces = anariDevice.newArray({data: [firstSurface, secondSurface]});
const group = anariDevice.newGroup({surface: surfaces});

const instances = anariDevice.newArray({data: [leftInstance, rightInstance]});
const world = anariDevice.newWorld({instance: instances});
```

The exported `ANARIObjectReference` union contains geometries, materials, surfaces, groups, instances, and lights. Use actual scene objects when an API expects an object-reference array; typed arrays in scene collection slots do not produce scene objects.

## `ANARIGeometry`

```ts
new ANARIGeometry(
  device: ANARIDevice,
  subtype: ANARIGeometrySubtype,
  parameters?: ANARIGeometryParameters
);

newGeometry(
  subtype: 'triangle' | 'sphere' | 'cylinder' | 'cone' | 'quad' | 'hexPrism' | 'torus' | 'ring',
  parameters?: ANARIGeometryParameters
): ANARIGeometry;
```

All geometry objects expose `type === 'geometry'`, their declared `subtype`, and the common staged-parameter lifecycle.

### Geometry parameters

```ts
type ANARIGeometryParameters = {
  'vertex.position'?: Float32Array | ANARIArray;
  'vertex.normal'?: Float32Array | ANARIArray;
  'vertex.tangent'?: Float32Array | ANARIArray;
  'vertex.joint'?: Uint8Array | Uint16Array | Uint32Array | ANARIArray;
  'vertex.weight'?: Float32Array | ANARIArray;
  'vertex.attribute0'?: Float32Array | ANARIArray;
  'vertex.attribute1'?: Float32Array | ANARIArray;
  'vertex.attribute2'?: Float32Array | ANARIArray;
  'primitive.index'?: Uint16Array | Uint32Array | ANARIArray;
  morphTargets?: readonly ANARIMorphTargetParameters[];
  morphWeights?: readonly number[];
  radius?: number;
  height?: number;
  width?: number;
  segments?: number;
  majorRadius?: number;
  minorRadius?: number;
  majorSegments?: number;
  minorSegments?: number;
  arc?: number;
};
```

| Parameter | Used by | Default | Meaning |
| --- | --- | --- | --- |
| `'vertex.position'` | `triangle` | Required | Packed XYZ positions as `Float32Array` or an `ANARIArray` wrapping one. |
| `'vertex.normal'` | `triangle` | Generated | Packed XYZ normals as `Float32Array` or an `ANARIArray` wrapping one. |
| `'vertex.tangent'` | `triangle` | Omitted | Packed XYZW tangent vectors; W stores tangent handedness. |
| `'vertex.joint'` | `triangle` | Omitted | Four integer skin-joint indices per vertex. |
| `'vertex.weight'` | `triangle` | Omitted | Four normalized floating-point joint weights per vertex. |
| `'vertex.attribute0'` | `triangle` | White | Packed linear RGB or RGBA vertex colors multiplied by the material base color. |
| `'vertex.attribute1'` | `triangle` | `[0, 0]` | Packed `TEXCOORD_0` UV pairs sampled by material image samplers. |
| `'vertex.attribute2'` | `triangle` | Omitted | Packed `TEXCOORD_1` UV pairs selected by `textureCoordinateSet: 1`. |
| `'primitive.index'` | `triangle` | No index buffer | Optional `Uint16Array`, `Uint32Array`, or wrapped ANARI array. |
| `morphTargets` | `triangle` | Omitted | Authored position, normal, and tangent displacement attributes per target. |
| `morphWeights` | `triangle` | `[]` | Current blend weight for each retained morph target. |
| `radius` | `sphere`, `cylinder`, `cone` | `1` | Primitive radius. |
| `height` | `cylinder`, `cone`, `quad` | `1` | Cylinder/cone height, or quad Z extent. |
| `width` | `quad` | `1` | Quad X extent and fallback Z extent. |
| `segments` | `sphere`, `cylinder`, `cone` | `32` | Primitive tessellation resolution. |

### Triangle geometry

```ts
const geometry = anariDevice.newGeometry('triangle', {
  'vertex.position': new Float32Array([
    -1, 0, 0,
     1, 0, 0,
     0, 1, 0
  ]),
  'vertex.normal': new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
  ]),
  'primitive.index': new Uint16Array([0, 1, 2])
});
```

`'vertex.position'` must resolve to a `Float32Array`; otherwise the first render throws. Positions and normals use three scalar values per vertex.

If normals are omitted, the renderer generates flat normals by reading each consecutive group of three positions as one triangle. For indexed meshes with shared vertices, supply explicit normals rather than relying on that non-indexed fallback.

### Secondary UV coordinates and vertex colors

```ts
const geometry = anariDevice.newGeometry('triangle', {
  'vertex.position': positions,
  'vertex.attribute0': new Float32Array([
    1, 0, 0, 0.5,
    0, 1, 0, 1,
    0, 0, 1, 1
  ]),
  'vertex.attribute1': new Float32Array([0, 0, 1, 0, 0, 1]),
  'vertex.attribute2': new Float32Array([0.5, 0.5, 1, 0.5, 0.5, 1])
});

const sampler = anariDevice.newSampler('image2D', {
  image: texture,
  textureCoordinateSet: 1
});
```

RGB and RGBA vertex-color layouts are detected from the vertex count. The additional alpha
component is retained when `COLOR_0` contains four channels. Texture-coordinate sets beyond
`TEXCOORD_1` are not supported.

### Skin attributes and joint palettes

```ts
const geometry = anariDevice.newGeometry('triangle', {
  'vertex.position': positions,
  'vertex.joint': jointIndices,
  'vertex.weight': normalizedJointWeights
});

const surface = anariDevice.newSurface({
  geometry,
  material,
  skin: {jointMatrices}
});
```

`jointMatrices` is a `Float32Array` or numeric array containing column-major joint matrices. The
existing shared skinning module currently supports up to 64 joints. The glTF showcase importer
preserves source joint indices and converts normalized integer `WEIGHTS_0` values to floats, but
does not automatically create or animate the surface joint palette; applications must supply and
update that palette explicitly.

### Morph targets

```ts
const geometry = anariDevice.newGeometry('triangle', {
  'vertex.position': positions,
  'vertex.normal': normals,
  'vertex.tangent': tangents,
  morphTargets: [
    {
      POSITION: positionDisplacements,
      NORMAL: normalDisplacements,
      TANGENT: tangentDisplacements
    }
  ],
  morphWeights: [0]
});

geometry.setParameter('morphWeights', [0.65]).commitParameters();
frame.render();
```

Position, normal, and tangent target attributes contain XYZ displacements; base tangent W remains
unchanged. Changing only `morphWeights` updates the existing GPU vertex data instead of rebuilding
the geometry/model. The optional retained-animation adapter maps glTF node weight tracks to these
parameters; see [ANARI animation and glTF integration](/docs/api-reference/scene/anari-animation).

### Sphere geometry

```ts
const sphere = anariDevice.newGeometry('sphere', {
  radius: 1.25,
  segments: 24
});
```

The runtime creates a luma.gl `SphereGeometry` with `segments` latitude subdivisions and `segments * 2` longitude subdivisions.

### Cylinder geometry

```ts
const cylinder = anariDevice.newGeometry('cylinder', {
  radius: 0.35,
  height: 2,
  segments: 32
});
```

Cylinders include top and bottom caps and one vertical subdivision.

### Cone geometry

```ts
const cone = anariDevice.newGeometry('cone', {
  radius: 0.8,
  height: 1.6,
  segments: 32
});
```

Cones include their base cap and one vertical subdivision.

### Quad geometry

```ts
const floor = anariDevice.newGeometry('quad', {
  width: 12,
  height: 8
});
```

Quads lie in the XZ plane. `width` controls X extent; `height` controls Z extent and defaults to `width` when omitted.

### Rebuilding committed geometry

```ts
sphere.setParameters({radius: 1.6, segments: 48}).commitParameters();
frame.render();
```

The renderer tracks committed geometry versions and recreates cached luma.gl geometry/models when
structural parameters change. Updates containing only new `morphWeights` retain the existing
geometry and update its vertex data in place. Reuse immutable geometry and surface objects whenever
possible; repeatedly changing tessellation or instance counts reallocates GPU resources.

### Mesh-backed chart shapes

`hexPrism` is a capped six-sided prism centered at the origin along Y. Its radius
is the circumradius (default `1`), height defaults to `1`, and side normals are
flat. `torus` is a ring around Y: `majorRadius` defaults to `1`, `minorRadius`
to `0.3`, `majorSegments` to `48`, and `minorSegments` to `24`. The minor radius
must be less than the major radius. `arc` is a positive sweep in radians up to
`2 * Math.PI` (the default). Partial sweeps have open ends, starting at +X and
sweeping toward −Z. They are surfaces, not closed solids.

Both shapes use shared math.gl tessellation for raster and ray rendering. They
retain the same placement IDs for picking, snapshots and selection outlines.
These are luma.gl subtypes; no ANARI KHR extension is advertised for them.
Dimension changes take effect after `commitParameters()` and rebuild the mesh.

```ts
const segment = anariDevice.newGeometry('torus', {
  majorRadius: 1,
  minorRadius: 0.2,
  arc: Math.PI * 1.5
});
```

Choose **Chart Shapes** in the JSON playground, or use
`playground.html?preset=chart-shapes&renderer=raytrace`. Switch to `renderer=default`
for the same raster scene. Click a visible mark in ray mode to inspect its datum
identity and selection outline.

### Annular prisms and ring segments

`ring` constructs a closed annular prism around Y from shared math.gl lathe and
plane tessellation. `innerRadius` defaults to `0.5` (zero creates a disk),
`outerRadius` to `1`, `height` to `0.2`, and `segments` to `48`. The outer radius
must exceed the nonnegative inner radius. `startAngle` defaults to zero and
`angle` to `2 * Math.PI`; a partial sweep includes both radial caps. Angles are
radians, starting at +X and sweeping toward −Z. Walls and caps retain distinct
normals and `POSITION`/`NORMAL`/`TEXCOORD_0` semantics. Dimension changes rebuild
the mesh after commit. The engine exports the same adapter as `RingGeometry`.

```ts
const segment = anariDevice.newGeometry('ring', {
  innerRadius: 0.5, outerRadius: 1, height: 0.4,
  startAngle: 0.2, angle: Math.PI * 1.5
});
```
