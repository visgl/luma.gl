# @luma.gl/effects

`@luma.gl/effects` provides shader passes and multi-pass pipelines for image adjustment, blur, bloom, antialiasing, depth-aware lighting, temporal reconstruction, atmosphere, and stylization.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use Effects after rendering a scene into textures that can be consumed by a fullscreen `ShaderPassRenderer`. Use a Shadertools shader module instead when the behavior belongs inside an object's material shader rather than a post-processing stage.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {brightnessContrast, toneMapping} from '@luma.gl/effects';

import {ShaderPassRenderer} from '@luma.gl/engine';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [brightnessContrast, toneMapping]

});



renderer.renderToScreen({sourceTexture});

renderer.destroy();
```

## Core concepts[​](#core-concepts "Direct link to Core concepts")

* A `ShaderPass` describes one fullscreen texture-processing stage.
* A shader-pass pipeline composes several ordered stages and owns its intermediate render targets.
* Temporal and depth-aware pipelines require explicit history, depth, velocity, or camera inputs.
* The caller owns source textures and command submission unless a renderer states otherwise.

## Capabilities[​](#capabilities "Direct link to Capabilities")

| Family                    | Examples                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- |
| Color and tone            | brightness/contrast, hue/saturation, vibrance, sepia, tone mapping, HDR exposure |
| Blur and focus            | Gaussian blur, bloom, depth of field, tilt shift, depth-aware blur               |
| Temporal and antialiasing | FXAA, TAA, camera reprojection, motion blur, persistence                         |
| Lighting and visibility   | SSAO, GTAO, SSGI, SSR, outlines                                                  |
| Atmosphere                | volumetric fog and clustered volumetric lighting                                 |
| Stylization and warp      | halftone, ink, noise, vignette, bulge, magnify, swirl                            |

## Public API index[​](#public-api-index "Direct link to Public API index")

The [Shader Pass Catalog](https://luma.gl/docs/api-reference/shadertools/shader-passes/image-processing.md) lists every effect, its inputs, compatibility, and cost. The [Shader Passes guide](https://luma.gl/docs/api-guide/shaders/shader-passes.md) explains scene integration and multi-pass composition.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

Simple fullscreen passes support WebGPU and WebGL 2 when both shader variants are provided. Storage-heavy, temporal, or clustered pipelines may require WebGPU and additional attachments. Check the compatibility section on the individual pass page.

## Related modules[​](#related-modules "Direct link to Related modules")

* [`@luma.gl/shadertools`](https://luma.gl/docs/api-reference/shadertools.md)
* [`ShaderPassRenderer`](https://luma.gl/docs/api-reference/engine/passes/shader-pass-renderer.md)
* [Experimental deferred rendering](https://luma.gl/docs/api-reference/experimental/deferred-scene-renderer.md)
