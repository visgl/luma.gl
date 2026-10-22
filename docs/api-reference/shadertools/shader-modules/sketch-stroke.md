# sketchStroke

Reusable GLSL and WGSL fragment coverage for solid or pencil-like strokes. Import `sketchStroke` and `SketchStrokeProps` from `@luma.gl/shadertools`.

Call `sketchStroke_getCoverage(coordinates, strokeLength, seed)` in a fragment shader. The first coordinate is normalized distance along the segment; the second is signed transverse distance in the same units as `strokeLength`, `width`, `jitter`, and `extension`. Pixel units are the default; world-unit adapters can set `minimumAntialias: 0` to use fragment derivatives. The result is scalar coverage to multiply into output alpha. Supply a stable, geometry-owned numeric seed.

| Property           | Default | Meaning                                                               |
| ------------------ | ------- | --------------------------------------------------------------------- |
| `width`            | 2       | Full line width in coordinate units                                   |
| `jitter`           | 0.7     | Maximum centerline displacement in coordinate units                   |
| `variation`        | 0.35    | Fractional width variation, 0–1                                       |
| `grain`            | 0.45    | Pencil grain strength, 0–1                                            |
| `extension`        | 3       | Endpoint overshoot in coordinate units                                |
| `minimumAntialias` | 0.7     | Minimum antialiasing distance in coordinate units; 0 uses derivatives |
| `sketch`           | 1       | Set to 0 for solid lines                                              |

The caller supplies expanded geometry, projection, depth testing, color, and blending. Reserve the stroke width, jitter, and extension plus the antialiasing fringe. For pixel coordinates, use at least `width * 0.65 + jitter + 1` transverse pixels and `extension + 1` longitudinal pixels. World-unit geometry must reserve enough space for the projected fragment footprint. Pixel-sized perspective geometry should supply linearly interpolated screen coordinates (or equivalent homogeneous compensation). This module does not generate mesh edges, connect paths, or schedule animation.
