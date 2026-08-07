# WBOITRenderer

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[SceneRenderer](https://luma.gl/next/docs/api-reference/experimental/scene-renderer.md)[Deferred Scenes](https://luma.gl/next/docs/api-reference/experimental/deferred-scene-renderer.md)[PBR Environments](https://luma.gl/next/docs/api-reference/experimental/pbr-environment.md)[GPU Projection](https://luma.gl/next/docs/api-reference/experimental/luproj.md)[GPU Rasters](https://luma.gl/next/docs/api-reference/experimental/luraster.md)[GPU Graphs](https://luma.gl/next/docs/api-reference/experimental/lugraph.md)[luDF](https://luma.gl/next/docs/api-reference/experimental/ludf.md)[LuxFilter](https://luma.gl/next/docs/api-reference/experimental/luxfilter.md)[GPU Traces](https://luma.gl/next/docs/api-reference/experimental/lutrace.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`WBOITRenderer` implements weighted blended order-independent transparency on WebGPU and WebGL2. It owns floating-point accumulation and revealage targets, records geometry capture passes, and resolves the captured transparency over an application-owned opaque color texture through a `ShaderPassPipeline`.

## Usage[​](#usage "Direct link to Usage")

```
import {Model, ShaderInputs, ShaderPassRenderer} from '@luma.gl/engine';

import {

  WBOITRenderer,

  createWBOITResolveShaderPassPipeline,

  wboit,

  wboitPlugin

} from '@luma.gl/experimental';



const shaderInputs = new ShaderInputs({wboit});

const model = new Model(device, {

  source,

  fs,

  plugins: [wboitPlugin],

  shaderInputs

});

const renderer = new WBOITRenderer(device, {colorFormat: 'rgba16float'});



// Render opaque color and depth into an application-owned scene framebuffer first.

opaqueModel.predraw(device.commandEncoder);

const opaquePass = device.beginRenderPass({framebuffer: sceneFramebuffer});

opaqueModel.draw(opaquePass);

opaquePass.end();



const outputTexture = renderer.render({

  sourceTexture: sceneFramebuffer.colorAttachments[0].texture,

  prepareOpaqueDepth: commandEncoder => opaqueModel.predraw(commandEncoder),

  drawOpaqueDepth: renderPass => opaqueModel.draw(renderPass),

  prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {

    shaderInputs.setProps({wboit: shaderModuleProps});

    model.setParameters({...model.parameters, ...captureParameters});

    model.predraw(commandEncoder);

  },

  drawTranslucent: renderPass => model.draw(renderPass)

});
```

The final fragment color must pass through one of the portable WGSL/GLSL helpers:

```
return wboit_captureStraightColor(color, inputs.Position);
```

```
fragColor = wboit_captureStraightColor(color, gl_FragCoord);
```

Use `wboit_capturePremultipliedColor` when RGB is already multiplied by alpha.

`render()` returns the resolved texture. To compose WBOIT directly into a larger advanced-effects stack, call `capture()` and pass its bindings to a `ShaderPassRenderer` containing `createWBOITResolveShaderPassPipeline()`:

```
const capture = renderer.capture({

  size: {width: sceneColor.width, height: sceneColor.height},

  drawOpaqueDepth,

  prepareTranslucent,

  drawTranslucent

});



const effects = new ShaderPassRenderer(device, {

  shaderPasses: [createWBOITResolveShaderPassPipeline(), bloomShaderPassPipeline]

});

const output = effects.renderToTexture({sourceTexture: sceneColor, bindings: capture.bindings});
```

## Rendering Model[​](#rendering-model "Direct link to Rendering Model")

For each frame the renderer:

1. Draws opaque depth into an internal depth target shared by both capture passes.
2. Accumulates weighted premultiplied color and weighted alpha into `rgba16float`.
3. Accumulates multiplicative revealage into a second `rgba16float` target.
4. Runs `createWBOITResolveShaderPassPipeline()` to composite the normalized weighted color and revealage over `sourceTexture`.

`prepareTranslucent` and `drawTranslucent` are called twice, once with `pass: 'accumulation'` and once with `pass: 'revealage'`.

## Support[​](#support "Direct link to Support")

`getWBOITSupport(device)` requires a WebGPU or WebGL2 device on which `rgba16float` is renderable and blendable. Construction throws the reported reason when support is unavailable.

The two color targets consume 16 bytes per pixel in addition to the internal depth texture. Unlike A-buffer OIT, memory does not depend on fragment count and no per-pixel sorting is required. The approximation can lose depth detail in scenes with many strongly overlapping layers.

## Types[​](#types "Direct link to Types")

```
export type WBOITPass = 'accumulation' | 'revealage';



export type WBOITRendererProps = {

  colorFormat?: TextureFormatColor;

};



export type WBOITRenderOptions = {

  sourceTexture: Texture;

  prepareOpaqueDepth?: (commandEncoder: CommandEncoder) => void;

  drawOpaqueDepth: (renderPass: RenderPass) => void;

  prepareTranslucent: (context: WBOITCaptureContext) => void;

  drawTranslucent: (renderPass: RenderPass) => void;

};
```

`sourceTexture` must include `Texture.SAMPLE` usage. `colorFormat` selects the resolved output format and defaults to the canvas-preferred format; set it to a supported, filterable `rgba16float` format to retain HDR color for later bloom or tone mapping. Existing `new WBOITRenderer(device)` calls remain valid. The renderer records commands but does not submit the device command encoder.
