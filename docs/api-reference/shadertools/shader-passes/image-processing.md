# Shader Pass Catalog

Explore reusable image-processing filters, cinematic lens effects, temporal reconstruction, and scene-aware WebGPU pipelines from `@luma.gl/effects`. Every effect below has its own implementation guide, parameter reference, composition notes, and, where an existing showcase is available, a live interactive example.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## Choosing an Effect[​](#choosing-an-effect "Direct link to Choosing an Effect")

| Category                  | Effects                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Typical placement                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Color and tone            | [Brightness and contrast](https://luma.gl/docs/api-reference/shadertools/shader-passes/brightness-contrast.md), [hue and saturation](https://luma.gl/docs/api-reference/shadertools/shader-passes/hue-saturation.md), [sepia](https://luma.gl/docs/api-reference/shadertools/shader-passes/sepia.md), [vibrance](https://luma.gl/docs/api-reference/shadertools/shader-passes/vibrance.md), [tone mapping](https://luma.gl/docs/api-reference/shadertools/shader-passes/tone-mapping.md), [HDR auto exposure](https://luma.gl/docs/api-reference/shadertools/shader-passes/hdr-auto-exposure.md)                                                                                                                                     | Exposure and grading before the final display transform.                        |
| Blur, bloom and focus     | [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md), [Gaussian blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/gaussian-blur.md), [triangle blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/triangle-blur.md), [tilt shift](https://luma.gl/docs/api-reference/shadertools/shader-passes/tilt-shift.md), [zoom blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/zoom-blur.md), [depth of field](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-of-field.md), [depth-aware blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md)                                                             | Scene-linear lighting and camera effects before tone mapping.                   |
| Temporal and antialiasing | [Persistence](https://luma.gl/docs/api-reference/shadertools/shader-passes/persistence.md), [FXAA](https://luma.gl/docs/api-reference/shadertools/shader-passes/fxaa.md), [temporal antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md), [camera-reprojection antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/camera-reprojection-antialiasing.md), [motion blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/motion-blur.md)                                                                                                                                                                                                           | Temporal accumulation before lens effects; FXAA near presentation.              |
| Lighting and visibility   | [SSAO](https://luma.gl/docs/api-reference/shadertools/shader-passes/ssao.md), [GTAO](https://luma.gl/docs/api-reference/shadertools/shader-passes/gtao.md), [screen-space global illumination](https://luma.gl/docs/api-reference/shadertools/shader-passes/screen-space-global-illumination.md), [screen-space reflections](https://luma.gl/docs/api-reference/shadertools/shader-passes/screen-space-reflections.md), [outlines](https://luma.gl/docs/api-reference/shadertools/shader-passes/outlines.md)                                                                                                                                                                                                                         | After scene rendering while depth, normals, and velocity still align.           |
| Atmosphere                | [Volumetric fog](https://luma.gl/docs/api-reference/shadertools/shader-passes/volumetric-fog.md), [clustered volumetric lighting](https://luma.gl/docs/api-reference/shadertools/shader-passes/clustered-volumetric-lighting.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | After opaque lighting and visibility; before exposure and bloom.                |
| Stylization and detail    | [Color halftone](https://luma.gl/docs/api-reference/shadertools/shader-passes/color-halftone.md), [dot screen](https://luma.gl/docs/api-reference/shadertools/shader-passes/dot-screen.md), [edge work](https://luma.gl/docs/api-reference/shadertools/shader-passes/edge-work.md), [hexagonal pixelation](https://luma.gl/docs/api-reference/shadertools/shader-passes/hexagonal-pixelate.md), [ink](https://luma.gl/docs/api-reference/shadertools/shader-passes/ink.md), [noise](https://luma.gl/docs/api-reference/shadertools/shader-passes/noise.md), [vignette](https://luma.gl/docs/api-reference/shadertools/shader-passes/vignette.md), [denoise](https://luma.gl/docs/api-reference/shadertools/shader-passes/denoise.md) | Creative finishing or targeted source cleanup.                                  |
| Warp and lens             | [Bulge and pinch](https://luma.gl/docs/api-reference/shadertools/shader-passes/bulge-pinch.md), [magnify](https://luma.gl/docs/api-reference/shadertools/shader-passes/magnify.md), [swirl](https://luma.gl/docs/api-reference/shadertools/shader-passes/swirl.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | After depth-dependent effects unless auxiliary attachments are transformed too. |

## Usage[​](#usage "Direct link to Usage")

Individual [`ShaderPass`](https://luma.gl/docs/api-reference/shadertools/shader-pass.md) descriptors and complete [`ShaderPassPipeline`](https://luma.gl/docs/api-reference/shadertools/shader-pass.md#shaderpasspipeline) graphs can share one ordered [`ShaderPassRenderer`](https://luma.gl/docs/api-reference/engine/passes/shader-pass-renderer.md):

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createBloomShaderPassPipeline, toneMapping, vignette} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [

    createBloomShaderPassPipeline({quality: 'high', blurAlgorithm: 'dual-kawase'}),

    toneMapping,

    vignette

  ]

});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {

    toneMapping: {exposure: 1, maximumLuminance: 1},

    vignette: {radius: 0.7, amount: 0.35}

  }

});
```

Every pass receives the output from the preceding stage. Pipelines may additionally allocate named scratch textures or persistent history, and WebGPU-enabled pipelines can replace supported render stages with compute work. The renderer owns its internal targets; application-owned scene attachments remain explicit bindings.

## Inputs and Compatibility[​](#inputs-and-compatibility "Direct link to Inputs and Compatibility")

| Input             | Required by                                                                                                   | Ownership                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `sourceTexture`   | Every shader pass and pipeline.                                                                               | Application provides the current scene or image.                                                                         |
| `depthTexture`    | Depth of field, bilateral blur, occlusion, reflections, temporal reconstruction, motion blur, and atmosphere. | Application retains the scene depth attachment.                                                                          |
| `normalTexture`   | Normal-aware occlusion, screen-space lighting and reflections, and optional outlines.                         | Application supplies view-space normals or a compatible G-buffer attachment.                                             |
| `velocityTexture` | Motion blur and velocity-based temporal reprojection.                                                         | Application supplies per-pixel screen-space motion.                                                                      |
| History textures  | Temporal antialiasing, adaptive exposure, temporal occlusion/reflections, and fog.                            | Named pipeline targets are owned by `ShaderPassRenderer`; `persistenceEffect` uses an application-owned history texture. |

The image-only adjustments, blur filters, stylization passes, warps, FXAA, and depth of field include both WGSL and GLSL implementations for WebGPU and WebGL2. The advanced scene-aware pipelines documented here use WGSL and target WebGPU. Bloom's portable render path works on both backends; fused downsampling and FFT convolution additionally require WebGPU.

info

deck.gl's existing [`PostProcessEffect`](https://deck.gl/docs/api-reference/core/post-process-effect) accepts individual shader-pass modules. Named-target `ShaderPassPipeline` graphs and the separate WebGPU FFT bloom renderer require an integration that explicitly executes those rendering paths.

## Related Guides[​](#related-guides "Direct link to Related Guides")

* [Shader Passes](https://luma.gl/docs/api-guide/shaders/shader-passes.md) explains routing, history, and complete HDR render stacks.
* [Rendering Techniques and Tradeoffs](https://luma.gl/docs/api-guide/shaders/rendering-techniques.md) compares blur, occlusion, reflections, transparency, and temporal techniques.
* [ShaderPassRenderer](https://luma.gl/docs/api-reference/engine/passes/shader-pass-renderer.md) documents execution, bindings, intermediate targets, and presentation.
* Many classic image filters are derived from Evan Wallace's [glfx.js](https://github.com/evanw/glfx.js).
