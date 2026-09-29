# sketchStroke

Reusable GLSL and WGSL fragment coverage for solid or pencil-like strokes. Import `sketchStroke`
and `SketchStrokeProps` from `@luma.gl/shadertools`.

Call `sketchStroke_getCoverage(coordinates, lengthPixels, seed)` in a fragment shader. The first
coordinate is normalized distance along the segment; the second is signed transverse distance in
pixels. `lengthPixels` uses the same pixel unit as the style. The result is scalar coverage to
multiply into output alpha. Supply a stable, geometry-owned numeric seed.

| Property | Default | Meaning |
| --- | --- | --- |
| `width` | 2 | Full line width in pixels |
| `jitter` | 0.7 | Maximum centerline displacement in pixels |
| `variation` | 0.35 | Fractional width variation, 0–1 |
| `grain` | 0.45 | Pencil grain strength, 0–1 |
| `extension` | 3 | Endpoint overshoot in pixels |
| `sketch` | 1 | Set to 0 for solid lines |

The caller supplies expanded geometry, projection, depth testing, color, and blending. Reserve
at least `width * 0.65 + jitter + 1` transverse pixels and `extension + 1` longitudinal pixels for
the stroke and antialiasing fringe. Perspective geometry should supply linearly interpolated
screen coordinates (or equivalent homogeneous compensation). This module does not generate
mesh edges, connect paths, or schedule animation.
