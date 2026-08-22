# Tone Mapping

Convert scene-linear high-dynamic-range lighting into display-ready color with an ACES-style filmic response. `toneMapping` compresses bright highlights, preserves source alpha, and exposes explicit controls for scene exposure and supported display luminance.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| Export            | `toneMapping`                                            |
| Backends          | WebGPU and WebGL2                                        |
| Render passes     | One fullscreen color-filter pass                         |
| Recommended input | Scene-linear floating-point color, such as `rgba16float` |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [createBloomShaderPassPipeline(), toneMapping]

});



renderer.renderToScreen({

  sourceTexture: hdrSceneTexture,

  uniforms: {toneMapping: {exposure: 1.2, maximumLuminance: 1}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter          | Default | Range       | Description                                                                                                |
| ------------------ | ------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `exposure`         | `1`     | `0` to `10` | Linear multiplier applied to scene color before the filmic response curve.                                 |
| `maximumLuminance` | `1`     | `1` to `4`  | Maximum output luminance; values above one preserve additional highlight range on compatible HDR displays. |

The implementation smoothly introduces extended highlight output as scene luminance rises. Source alpha is passed through unchanged.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Keep physically motivated lighting, adaptive exposure, temporal accumulation, and [Bloom](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/bloom.md) in floating-point scene color before tone mapping. Apply presentation-oriented grading and FXAA afterward when those operations should see the final display-referred image. Tone mapping adds one inexpensive fullscreen color pass and owns no persistent textures.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [HDR Auto Exposure](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hdr-auto-exposure.md) meters changing scene brightness on the GPU.
* [Bloom](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/bloom.md) spreads highlights before the final display transform.
* [FXAA](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/fxaa.md) can smooth visible display-space contrast edges near presentation.
