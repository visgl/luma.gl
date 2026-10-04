# makeStrokeGeometry

Triangulates a connected path into a local XY stroke, with butt, square, or round caps and miter, bevel, or round joins. Optional vertex elevations are preserved. Width and distance use the same units as the input coordinates; convert geographic coordinates to a local Cartesian system before calling this helper.

```typescript
import {makeStrokeGeometry} from '@luma.gl/engine';

const geometry = makeStrokeGeometry([[0, 0, 0], [100, 0, 0], [100, 75, 8]], {
  width: 4,
  cap: 'round',
  join: 'miter',
  miterLimit: 4
});
```

The returned `Geometry` has triangle-list topology and owned Float32 arrays:

| Attribute | Contents |
| --- | --- |
| `POSITION` | Local XYZ positions (three values per vertex) |
| `TEXCOORD_0` | Cumulative XY path distance and signed distance across the stroke |

Use the first texture coordinate with the [`pathDash`](../../shadertools/shader-modules/path-dash.md) shader module. GPU upload and resource ownership follow the normal `Geometry` and `Model` contracts.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `width` | `1` | Full width in local coordinate units, finite and nonnegative |
| `cap` | `'butt'` | `'butt'`, `'square'`, or `'round'` at open path ends |
| `join` | `'miter'` | `'miter'`, `'bevel'`, or `'round'` at corners |
| `miterLimit` | `4` | Maximum miter length divided by half width; at least 1 |
| `roundSegments` | `16` | Triangles per semicircle; integer from 2 to 256 |
| `closed` | `false` | Connect last point to first and omit endpoint caps |
| `id` | Generated | Geometry identifier |

Miters beyond the limit fall back to bevel joins. Consecutive duplicate XY points are removed, keeping the first elevation. Zero width or fewer than two distinct XY points produces empty geometry. Exact reversals split the stroke at the turn; round joins add endpoint arcs there. Inner intersections at tight bevel or round corners are bounded by neighboring segment lengths.

## Scope

This is CPU tessellation for local planar strokes, not a screen-pixel-width line renderer. Elevation changes interpolate along each segment; widths are offsets in XY, not in a 3D surface tangent plane. Rebuild geometry when path shape or stroke dimensions change. Dash uniforms can change without rebuilding.

The distance coordinate resets at the closing seam. For seamless closed-loop dashes, choose a period that divides the total path length or adjust it in the application. Square and round caps extend distance coordinates beyond the open path endpoints. Caps shape path ends; the dash module cuts straight dash ends.

Self-intersections, retraced paths, and strokes wider than local path features can overlap. The helper does not compute a polygon union; translucent compositing may reveal those overlaps. Very large coordinates should be rebased before conversion to Float32.
