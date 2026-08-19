import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Transparency

<ShaderLevelDocsTabs group="techniques" active="transparency" />

Transparency has two independent concerns: how each surface is shaded and how overlapping
fragments are ordered. Fresnel reflection or refraction does not fix incorrect fragment ordering,
and an order-independent transparency renderer does not automatically create realistic glass.

## Choose a Compositing Strategy

| Strategy | Backends | Strength | Limitation |
| --- | --- | --- | --- |
| Sorted alpha blending | WebGPU and WebGL 2 | Minimal memory and broad compatibility. | Object-level sorting cannot correctly resolve intersecting or deeply overlapping surfaces. |
| Weighted-blended OIT | WebGPU and supported WebGL 2 | Order-independent accumulation at bounded memory cost. | Fragment colors and depths are combined approximately. |
| A-buffer OIT | WebGPU | Per-pixel fragment capture and depth-sorted resolve. | Storage use grows with the configured fragment budget. |

[`WBOITRenderer`](/docs/api-reference/experimental/wboit-renderer) provides weighted-blended
transparency. [`ABufferRenderer`](/docs/api-reference/experimental/a-buffer-renderer) provides
per-pixel linked-list capture and ordered compositing.

When neither OIT path is available, sort transparent objects or instances back to front relative
to the active camera, disable depth writes, and leave opaque-depth testing enabled. Resort whenever
the view or object positions change.

## Render Opaque Geometry First

Render opaque geometry into the scene color and depth targets before drawing transparent surfaces.
Transparent fragments must continue to respect the opaque depth buffer so hidden glass does not
appear through nearer solid geometry.

For weighted blending and A-buffer rendering, pass the existing opaque color and depth targets to
the selected renderer, then resolve translucent capture over the opaque scene. The resulting color
can continue through the normal shader-pass chain.

When opaque objects emit HDR light, configure the transparency renderer with
`colorFormat: 'rgba16float'` whenever the device supports rendering and filtering that format.
Otherwise an intermediate resolve can clamp values above `1.0` before bloom or tone mapping sees
them. Both `ABufferRenderer` and `WBOITRenderer` accept an optional output color format while
retaining their existing display-format defaults.

## Capture Scene Color Before Refraction

Screen-space transmission needs a stable texture containing previously rendered scene color.
Create or copy that texture before the translucent pass:

1. Render opaque scene geometry.
2. Resolve or copy the opaque color attachment into a separate sampleable texture.
3. Render refractive transparent geometry while sampling that texture.
4. Resolve the transparency renderer, if one is used.
5. Apply bloom to the resolved HDR scene, tone-map the result, and present the composed scene.

WebGPU does not permit a texture to be sampled while it is also bound as the active render target.
Use a distinct scene-color texture rather than sampling the current attachment directly.

## Compose Surface Materials and OIT

Optical materials shade the surface first; the transparency plugin captures the resulting color:

```ts
import {ShaderInputs} from '@luma.gl/engine';
import {
  aBuffer,
  aBufferPlugin,
  glassMaterial,
  glassMaterialPlugin
} from '@luma.gl/experimental';

const shaderInputs = new ShaderInputs({glassMaterial, aBuffer});

shaderInputs.setProps({
  glassMaterial: {
    viewportSize: [width, height],
    sceneColorTexture,
    indexOfRefraction: 1.5
  },
  aBuffer: captureProperties
});

const plugins = [glassMaterialPlugin, aBufferPlugin];
```

The fragment shader calls `glassMaterial_getColor(...)` and then passes that result to
`aBuffer_captureStraightColor(...)`. For weighted blending, replace the A-buffer module and plugin
with `wboit` and `wboitPlugin`. Use `glassMaterial_getIlluminatedColor(...)` with
`opticalPointLightsPlugin` when nearby emissive objects should illuminate the translucent surface.

See [Glass Effects](/docs/api-guide/shaders/glass-effects) for the material model and
[Rendering Techniques and Tradeoffs](/docs/api-guide/shaders/rendering-techniques) for broader
renderer selection.
