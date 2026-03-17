# Built-in Geometries

`@luma.gl/engine` exports several ready-made geometry classes. All of them extend [`Geometry`](/docs/api-reference/engine/geometry) and populate standard attributes such as `POSITION`, `NORMAL`, and `TEXCOORD_0`.

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
- When you need to upload those attributes into GPU buffers, use them directly with [`Model`](/docs/api-reference/engine/model) or convert them through [`GPUGeometry`](/docs/api-reference/engine/geometry/gpu-geometry).
