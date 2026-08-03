# ANARI Arrays and Geometry

![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)![Private workspace](https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square)![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)

`ANARIArray` describes shared application data, and `ANARIGeometry` describes one reusable geometric primitive. Geometry becomes visible when paired with a material in an [`ANARISurface`](https://luma.gl/next/docs/api-reference/anari/anari-scene.md).

## `ANARIArray`[​](#anariarray "Direct link to anariarray")

```
new ANARIArray(device: ANARIDevice, parameters: ANARIArrayParameters);
```

Applications normally call the equivalent `anariDevice.newArray(parameters)` factory:

```
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

### Parameters[​](#parameters "Direct link to Parameters")

```
type ANARIArrayParameters = {
  data: ANARIArrayData;
  elementType?: string;
  dimensions?: readonly number[];
};

type ANARIArrayData = TypedArray | readonly ANARIObjectReference[];
```

| Parameter     | Required | Meaning                                                         |
| ------------- | -------- | --------------------------------------------------------------- |
| `data`        | Yes      | A typed array or an array of retained ANARI object references.  |
| `elementType` | No       | Application-provided element metadata, for example `float32x3`. |
| `dimensions`  | No       | Application-provided dimension metadata.                        |

The current implementation preserves the original typed array without copying. `elementType` and `dimensions` are retained metadata; the renderer does not currently validate or reinterpret them.

### Properties[​](#properties "Direct link to Properties")

```
array.data: ANARIArrayData;
array.length: number;
```

`length` is the JavaScript `data.length`. For `new Float32Array(9)`, the result is `9` scalar values, not three vector elements. For an object-reference array, it is the number of objects.

Mutating the original typed array mutates the retained storage:

```
positions[0] = -2;
positionArray.data === positions; // true
```

When geometry data changes after its first render, commit the owning geometry so its cached GPU representation is rebuilt:

```
positions[0] = -2;
geometry.commitParameters();
```

### Object-reference arrays[​](#object-reference-arrays "Direct link to Object-reference arrays")

```
const surfaces = anariDevice.newArray({data: [firstSurface, secondSurface]});
const group = anariDevice.newGroup({surface: surfaces});

const instances = anariDevice.newArray({data: [leftInstance, rightInstance]});
const world = anariDevice.newWorld({instance: instances});
```

The exported `ANARIObjectReference` union contains geometries, materials, surfaces, groups, instances, and lights. Use actual scene objects when an API expects an object-reference array; typed arrays in scene collection slots do not produce scene objects.

## `ANARIGeometry`[​](#anarigeometry "Direct link to anarigeometry")

```
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

### Geometry parameters[​](#geometry-parameters "Direct link to Geometry parameters")

```
type ANARIGeometryParameters = {
  'vertex.position'?: Float32Array | ANARIArray;
  'vertex.normal'?: Float32Array | ANARIArray;
  'vertex.attribute0'?: Float32Array | ANARIArray;
  'vertex.attribute1'?: Float32Array | ANARIArray;
  'primitive.index'?: Uint16Array | Uint32Array | ANARIArray;
  radius?: number;
  height?: number;
  width?: number;
  segments?: number;
};
```

| Parameter             | Used by                      | Default         | Meaning                                                                 |
| --------------------- | ---------------------------- | --------------- | ----------------------------------------------------------------------- |
| `'vertex.position'`   | `triangle`                   | Required        | Packed XYZ positions as `Float32Array` or an `ANARIArray` wrapping one. |
| `'vertex.normal'`     | `triangle`                   | Generated       | Packed XYZ normals as `Float32Array` or an `ANARIArray` wrapping one.   |
| `'vertex.attribute0'` | `triangle`                   | White           | Packed linear RGB vertex colors multiplied by the material base color.  |
| `'vertex.attribute1'` | `triangle`                   | `[0, 0]`        | Packed `TEXCOORD_0` UV pairs sampled by material image samplers.        |
| `'primitive.index'`   | `triangle`                   | No index buffer | Optional `Uint16Array`, `Uint32Array`, or wrapped ANARI array.          |
| `radius`              | `sphere`, `cylinder`, `cone` | `1`             | Primitive radius.                                                       |
| `height`              | `cylinder`, `cone`, `quad`   | `1`             | Cylinder/cone height, or quad Z extent.                                 |
| `width`               | `quad`                       | `1`             | Quad X extent and fallback Z extent.                                    |
| `segments`            | `sphere`, `cylinder`, `cone` | `32`            | Primitive tessellation resolution.                                      |

### Triangle geometry[​](#triangle-geometry "Direct link to Triangle geometry")

```
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

### Sphere geometry[​](#sphere-geometry "Direct link to Sphere geometry")

```
const sphere = anariDevice.newGeometry('sphere', {
  radius: 1.25,
  segments: 24
});
```

The runtime creates a luma.gl `SphereGeometry` with `segments` latitude subdivisions and `segments * 2` longitude subdivisions.

### Cylinder geometry[​](#cylinder-geometry "Direct link to Cylinder geometry")

```
const cylinder = anariDevice.newGeometry('cylinder', {
  radius: 0.35,
  height: 2,
  segments: 32
});
```

Cylinders include top and bottom caps and one vertical subdivision.

### Cone geometry[​](#cone-geometry "Direct link to Cone geometry")

```
const cone = anariDevice.newGeometry('cone', {
  radius: 0.8,
  height: 1.6,
  segments: 32
});
```

Cones include their base cap and one vertical subdivision.

### Quad geometry[​](#quad-geometry "Direct link to Quad geometry")

```
const floor = anariDevice.newGeometry('quad', {
  width: 12,
  height: 8
});
```

Quads lie in the XZ plane. `width` controls X extent; `height` controls Z extent and defaults to `width` when omitted.

### Rebuilding committed geometry[​](#rebuilding-committed-geometry "Direct link to Rebuilding committed geometry")

```
sphere.setParameters({radius: 1.6, segments: 48}).commitParameters();
frame.render();
```

The renderer tracks the committed geometry `version` and recreates its cached luma.gl geometry/model after a geometry commit. Reuse immutable geometry and surface objects whenever possible; repeatedly changing tessellation or instance counts reallocates GPU resources.
