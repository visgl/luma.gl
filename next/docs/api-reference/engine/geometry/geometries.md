# Built-in Geometries

[Geometry](https://luma.gl/next/docs/api-reference/engine/geometry.md)[GPUGeometry](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md)[Built-ins](https://luma.gl/next/docs/api-reference/engine/geometry/geometries.md)

`@luma.gl/engine` exports several ready-made geometry classes. All of them extend [`Geometry`](https://luma.gl/next/docs/api-reference/engine/geometry.md) and populate standard glTF mesh attribute semantics such as `POSITION`, `NORMAL`, and `TEXCOORD_0`.

The engine exports are compatibility adapters over the tessellators in `@math.gl/geometry`. They retain legacy size defaults, plane axis options, and cube face identifiers. New code can import primitives directly from `@math.gl/geometry` and pass them to `Model`; use explicit sizes and radii because math.gl defaults follow glTF shape conventions. GPU buffer layouts and interleaving remain engine responsibilities.

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
* When uploaded through [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) or [`makeGPUGeometry()`](https://luma.gl/next/docs/api-reference/engine/geometry/gpu-geometry.md), built-in primitives are interleaved into one vertex buffer plus an optional index buffer.

### `TorusGeometry`[​](#torusgeometry "Direct link to torusgeometry")

`TorusGeometry` wraps the shared `@math.gl/geometry/parametric` tessellator with luma.gl's CPU `Geometry` container. It preserves indexed `POSITION`, `NORMAL`, and `TEXCOORD_0` semantics and caller-provided attribute overrides.

```
import {TorusGeometry} from '@luma.gl/engine';



const geometry = new TorusGeometry({

  majorRadius: 1,

  minorRadius: 0.3,

  majorSegments: 48,

  minorSegments: 24,

  arc: Math.PI * 1.5

});
```

The defaults above apply except that `arc` defaults to `2 * Math.PI`. The ring lies around Y, starts at +X and sweeps toward −Z. Partial sweeps have open ends. Radii must be positive, the minor radius must be smaller than the major radius, and each segment count must be an integer of at least three.

### `RingGeometry`[​](#ringgeometry "Direct link to ringgeometry")

`RingGeometry` constructs a closed annular prism or capped ring segment by assembling shared math.gl lathe/plane meshes. Props are `innerRadius` (`0.5`), `outerRadius` (`1`), `height` (`0.2`), `segments` (`48`), `startAngle` (`0`) and `angle` (`2 * Math.PI`). Zero inner radius creates a disk. Partial sweeps include both radial caps; cap/wall corners have hard normals. The source mesh retains indexed glTF attribute semantics and caller-provided attribute overrides.
