# Vignette

Darken the image perimeter with a smooth radial falloff. `vignette` concentrates visual attention toward the center and provides an adjustable photographic finishing effect.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                            |
| ----------------- | -------------------------------- |
| Export            | `vignette`                       |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {bloom, vignette} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [bloom, vignette]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {

    bloom: {radius: 9, threshold: 0.48, intensity: 1.85},

    vignette: {radius: 0.7, amount: 0.45}

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Range      | Description                                                                  |
| --------- | ------- | ---------- | ---------------------------------------------------------------------------- |
| `radius`  | `0.5`   | `0` to `1` | Normalized size of the central region before edge darkening becomes visible. |
| `amount`  | `0.5`   | `0` to `1` | Strength of the perimeter-darkening treatment.                               |

The public property is `radius`; older references that call it `size` do not match the current shader-pass implementation.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Vignette adds one fullscreen color pass and requires no auxiliary textures or persistent state. It is normally composed late so it darkens the finished image evenly. Place it after bloom when the outer glow should also recede toward the frame edges.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Bloom](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/bloom.md) provides complementary central or highlight-focused glow.
* [Sepia](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/sepia.md) combines with edge darkening for an archival photographic grade.
* [Noise](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/noise.md) adds controllable finishing grain.
