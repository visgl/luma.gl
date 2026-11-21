# Built-in Geometries

[Geometry](https://luma.gl/docs/api-reference/engine/geometry.md)[GPUGeometry](https://luma.gl/docs/api-reference/engine/geometry/gpu-geometry.md)[Built-ins](https://luma.gl/docs/api-reference/engine/geometry/geometries.md)

`@luma.gl/engine` exports several ready-made geometry classes. All of them extend [`Geometry`](https://luma.gl/docs/api-reference/engine/geometry.md) and populate standard glTF mesh attribute semantics such as `POSITION`, `NORMAL`, and `TEXCOORD_0`.

## Overview[​](#overview "Direct link to Overview")

| Class                   | Notes                                             |
| ----------------------- | ------------------------------------------------- |
| `ConeGeometry`          | Cone with optional caps.                          |
| `CubeGeometry`          | Unit cube geometry.                               |
| `CylinderGeometry`      | Cylinder built on top of `TruncatedConeGeometry`. |
| `IcoSphereGeometry`     | Icosahedron-based sphere approximation.           |
| `PlaneGeometry`         | Grid plane in `x,y`, `x,z`, or `y,z`.             |
| `SphereGeometry`        | Latitude/longitude sphere.                        |
| `TruncatedConeGeometry` | Generalized cone or frustum primitive.            |

## Common Pattern[​](#common-pattern "Direct link to Common Pattern")

```
import {SphereGeometry} from '@luma.gl/engine';



const geometry = new SphereGeometry({radius: 2});
```

## Selected Constructor Props[​](#selected-constructor-props "Direct link to Selected Constructor Props")

### `ConeGeometry`[​](#conegeometry "Direct link to conegeometry")

* `radius?`
* `cap?`
* Inherits radial, vertical, height, and axis options from `TruncatedConeGeometry`

### `CylinderGeometry`[​](#cylindergeometry "Direct link to cylindergeometry")

* `radius?`
* Inherits cap, radial, vertical, height, and axis options from `TruncatedConeGeometry`

### `TruncatedConeGeometry`[​](#truncatedconegeometry "Direct link to truncatedconegeometry")

* `topRadius?`
* `bottomRadius?`
* `topCap?`
* `bottomCap?`
* `height?`
* `nradial?`
* `nvertical?`
* `verticalAxis?`

### `PlaneGeometry`[​](#planegeometry "Direct link to planegeometry")

* `type?`
* `xlen?`, `ylen?`, `zlen?`
* `nx?`, `ny?`, `nz?`
* `offset?`

### `SphereGeometry`[​](#spheregeometry "Direct link to spheregeometry")

* `radius?`
* `nlat?`
* `nlong?`

### `IcoSphereGeometry`[​](#icospheregeometry "Direct link to icospheregeometry")

* `iterations?`

## Remarks[​](#remarks "Direct link to Remarks")

* These classes are convenience wrappers around typed-array geometry generation.
* Most built-in primitives generate indexed geometry by default. `CubeGeometry({indices: false})` and `PlaneGeometry({unpack: true})` are non-indexed variants.
* When uploaded through [`Model`](https://luma.gl/docs/api-reference/engine/model.md) or [`makeGPUGeometry()`](https://luma.gl/docs/api-reference/engine/geometry/gpu-geometry.md), built-in primitives are interleaved into one vertex buffer plus an optional index buffer.
