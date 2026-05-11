# Built-in Geometries

`@luma.gl/engine` exports several ready-made geometry classes. All of them extend [`Geometry`](/docs/api-reference/engine/geometry) and populate standard shader attributes such as `positions`, `normals`, and `texCoords`.

## Overview

| Class | Notes |
| --- | --- |
| `ConeGeometry` | Cone with optional caps. |
| `CubeGeometry` | Unit cube geometry. |
| `CylinderGeometry` | Cylinder built on top of `TruncatedConeGeometry`. |
| `IcoSphereGeometry` | Icosahedron-based sphere approximation. |
| `PlaneGeometry` | Grid plane in `x,y`, `x,z`, or `y,z`. |
| `SphereGeometry` | Latitude/longitude sphere. |
| `TruncatedConeGeometry` | Generalized cone or frustum primitive. |

## Common Pattern

```typescript
import {SphereGeometry} from '@luma.gl/engine';

const geometry = new SphereGeometry({radius: 2});
```

## Selected Constructor Props

### `ConeGeometry`

- `radius?`
- `cap?`
- Inherits radial, vertical, height, and axis options from `TruncatedConeGeometry`

### `CylinderGeometry`

- `radius?`
- Inherits cap, radial, vertical, height, and axis options from `TruncatedConeGeometry`

### `TruncatedConeGeometry`

- `topRadius?`
- `bottomRadius?`
- `topCap?`
- `bottomCap?`
- `height?`
- `nradial?`
- `nvertical?`
- `verticalAxis?`

### `PlaneGeometry`

- `type?`
- `xlen?`, `ylen?`, `zlen?`
- `nx?`, `ny?`, `nz?`
- `offset?`

### `SphereGeometry`

- `radius?`
- `nlat?`
- `nlong?`

### `IcoSphereGeometry`

- `iterations?`

## Remarks

- These classes are convenience wrappers around typed-array geometry generation.
- Most built-in primitives generate indexed geometry by default. `CubeGeometry({indices: false})` and `PlaneGeometry({unpack: true})` are non-indexed variants.
- When uploaded through [`Model`](/docs/api-reference/engine/model) or [`makeGPUGeometry()`](/docs/api-reference/engine/geometry/gpu-geometry), built-in primitives are interleaved into one vertex buffer plus an optional index buffer.
