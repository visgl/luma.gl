# pathDash

`pathDash` computes filtered dash coverage from cumulative path distance. It provides matching GLSL and WGSL fragment-stage implementations, with no textures or vertex-buffer allocation.

```
import {pathDash} from '@luma.gl/shadertools';



const model = new Model(device, {

  // ...shaders, geometry, and buffer bindings

  modules: [pathDash]

});

model.shaderInputs.setProps({pathDash: {dashLength: 12, gapLength: 8, offset: 0}});
```

In the fragment shader, call `pathDash_getCoverage(distanceAlongPath)` to obtain coverage from zero to one. Multiply fragment alpha by coverage for straight-alpha blending, or multiply all color channels when writing premultiplied color. For picking, discard fragments with negligible coverage before encoding the feature ID.

| Property     | Default | Meaning                              |
| ------------ | ------- | ------------------------------------ |
| `dashLength` | `12`    | Ink length, clamped to nonnegative   |
| `gapLength`  | `8`     | Empty length, clamped to nonnegative |
| `offset`     | `0`     | Phase added to path distance         |

Lengths and offset use the coordinate's units. A positive offset moves the pattern toward decreasing path distance. A zero gap produces solid coverage, including when dash length is zero. Otherwise, zero dash length produces no coverage. Partial uniform updates retain previous values.

Coverage integrates the periodic pulse over the fragment's derivative footprint. Distant dashes converge to their average ink fraction instead of flickering between solid and empty. Call this function before divergent fragment branches so derivatives remain valid. This filters dash boundaries; it does not antialias the outer stroke silhouette, choose line width, or generate caps and joins. Use [`makeStrokeGeometry`](https://luma.gl/next/docs/api-reference/engine/geometry/stroke-geometry.md) or a custom line renderer for the geometry.

## Compose stroke styles[​](#compose-stroke-styles "Direct link to Compose stroke styles")

Dash coverage can multiply `sketchStroke_getCoverage` for pencil paths or the radiance returned by `pointGlow_getColor` for luminous paths. The [Riverfront routes example](https://luma.gl/next/examples/deck/styled-paths) uses both with the same `makeStrokeGeometry` output. It passes metres to the pencil shader and sets `minimumAntialias: 0` to rely on derivatives; existing pixel-sized pencil strokes retain the `0.7` default. Glow maps transverse distance, and endpoint distance for caps, into the point shader's normalized radial coordinates. Blend that radiance additively and keep faint halo fragments out of the picking pass. The caller remains responsible for geometry, blend state, occlusion, and stable feature seeds.
