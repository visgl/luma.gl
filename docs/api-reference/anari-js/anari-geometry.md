# ANARI Arrays and Geometry

`ANARIArray` describes shared application data, and `ANARIGeometry` describes one reusable geometric primitive. Geometry becomes visible when paired with a material in an [`ANARISurface`](/docs/api-reference/anari-js/anari-scene).

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
  subtype: 'triangle' | 'sphere' | 'cylinder' | 'cone' | 'quad',
  parameters?: ANARIGeometryParameters
): ANARIGeometry;
```

All geometry objects expose `type === 'geometry'`, their declared `subtype`, and the common staged-parameter lifecycle.

### Geometry parameters

```ts
type ANARIGeometryParameters = {
  'vertex.position'?: Float32Array | ANARIArray;
  'vertex.normal'?: Float32Array | ANARIArray;
  'vertex.attribute0'?: Float32Array | ANARIArray;
  'primitive.index'?: Uint16Array | Uint32Array | ANARIArray;
  radius?: number;
  height?: number;
  width?: number;
  segments?: number;
};
```

| Parameter | Used by | Default | Meaning |
| --- | --- | --- | --- |
| `'vertex.position'` | `triangle` | Required | Packed XYZ positions as `Float32Array` or an `ANARIArray` wrapping one. |
| `'vertex.normal'` | `triangle` | Generated | Packed XYZ normals as `Float32Array` or an `ANARIArray` wrapping one. |
| `'vertex.attribute0'` | None currently | — | Accepted for API compatibility; not consumed by the current shader. |
| `'primitive.index'` | `triangle` | No index buffer | Optional `Uint16Array`, `Uint32Array`, or wrapped ANARI array. |
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

The renderer tracks the committed geometry `version` and recreates its cached luma.gl geometry/model after a geometry commit. Reuse immutable geometry and surface objects whenever possible; repeatedly changing tessellation or instance counts reallocates GPU resources.
