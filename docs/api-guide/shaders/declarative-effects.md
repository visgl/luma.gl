# Declarative fullscreen effects

An effect definition is a typed object you can export from a module and reuse with
multiple renderers. It describes the textures and draws needed for an effect.
`EffectRenderer` allocates the textures, runs the passes, and manages history.
The API is a prototype for fullscreen processing of rendered scene textures.

## Apply effects to a scene

Render the scene to sampleable color and depth textures. If you use shadow maps,
render those and bind them to the scene materials during scene shading. The
fullscreen stack then processes the shaded scene color.

```ts
import {EffectRenderer} from '@luma.gl/engine';
import {bloomLow, ssao} from '@luma.gl/engine/effects';

const effects = new EffectRenderer(device, {
  effects: [ssao, bloomLow],
  colorFormat: 'rgba16float'
});

effects.resize([width, height]);

// Run after scene rendering on each frame.
effects.renderToScreen({
  sourceTexture: sceneColor,
  bindings: {depthTexture: sceneDepth},
  uniforms: {
    ssaoEvaluate: {nearPlane: 0.1, farPlane: 200},
    bloomComposite: {intensity: 0.75}
  }
});
```

The effects run in array order. SSAO samples the scene depth and updates the
color image. Bloom reads that updated image and adds glow. Use
`renderToTexture` when another stage needs to sample the result. Call `resize`
when the output dimensions change and `destroy` when the stack is no longer
needed. The scene supplies and owns the input textures.

To use camera-reprojection TAA, add `cameraReprojectionTaa` between SSAO and
bloom. Supply the camera matrices and jitter each frame as
`cameraReprojectionTaaResolve` uniforms. After a camera cut, call
`resetHistory()` before rendering the next frame. See the
[camera-reprojection shader definition](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/effects/passes/screen-space/camera-reprojection-temporal-antialiasing.ts)
for its camera uniform types.

## Author an effect

Start with a fullscreen shader that follows the
[shader pass convention](../../api-reference/engine/passes/shader-pass-renderer.md).
Declare a pass for each draw and route each shader's inputs to the textures it
samples. This example adjusts contrast and then applies a vignette, reusing two built-in shaders.

```ts
import type {EffectDefinition} from '@luma.gl/engine';
import {brightnessContrast, vignette} from '@luma.gl/engine/effects';

export const softVignette = {
  name: 'softVignette',
  resources: {
    adjusted: {}
  },
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: brightnessContrast,
      inputs: {sourceTexture: 'previous'},
      output: 'adjusted',
      uniforms: {contrast: 0.15}
    },
    {
      kind: 'fullscreen',
      shaderPass: vignette,
      inputs: {sourceTexture: 'adjusted'},
      output: 'previous'
    }
  ]
} satisfies EffectDefinition<'adjusted'>;
```

- **Resources** are private to each occurrence of the effect. Set the texture
  format and scale when the default format or full resolution is unsuitable.
  `satisfies EffectDefinition<...>` checks that named targets are declared.
- **Inputs** map shader binding names to textures. `previous` reads the current
  color chain and `original` reads the input to the entire stack. Supply scene
  textures such as depth in the render call's `bindings`.
- **Outputs** select a named target or update the shared color chain with
  `previous`. Set per-pass defaults in `uniforms` and apply per-frame
  overrides by shader module name in the render call.
- **History** uses `lifetime: 'history'`. Specify how to initialize the texture
  on the first frame or after a reset. A pass can read the previous frame and
  write the current frame using the same history target name.

## Offer a WebGPU implementation with a fragment fallback

Put the two implementations in `initialPasses`, then list their shared
downstream draws in `passes`. Bloom declares half- and quarter-resolution
extraction textures. Its compute branch writes both in one dispatch. Its
fragment branch extracts highlights at half resolution, then downsamples to
quarter resolution. Both feed the same blur and reconstruction passes.

For your own compute variant, map each storage binding to a named output and
mark those resources with `storage: true`. The first output's dimensions
determine the dispatch grid. The renderer checks WebGPU, storage-format
support, binding limits, and workgroup dimensions. On other devices it runs
the fragment sequence. Both paths should populate every resource the shared
passes read.
