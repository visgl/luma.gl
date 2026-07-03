import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# WBOITRenderer

<ExperimentalDocsTabs active="wboit-renderer" />

`WBOITRenderer` implements weighted blended order-independent transparency on WebGPU and WebGL2.
It owns floating-point accumulation and revealage targets, records geometry capture passes, and
resolves the captured transparency over an application-owned opaque color texture through a
`ShaderPassPipeline`.

## Usage

```ts
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
const renderer = new WBOITRenderer(device);

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

```wgsl
return wboit_captureStraightColor(color, inputs.Position);
```

```glsl
fragColor = wboit_captureStraightColor(color, gl_FragCoord);
```

Use `wboit_capturePremultipliedColor` when RGB is already multiplied by alpha.

`render()` returns the resolved texture. To compose WBOIT directly into a larger advanced-effects
stack, call `capture()` and pass its bindings to a `ShaderPassRenderer` containing
`createWBOITResolveShaderPassPipeline()`:

```ts
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

## Rendering Model

For each frame the renderer:

1. Draws opaque depth into an internal depth target shared by both capture passes.
2. Accumulates weighted premultiplied color and weighted alpha into `rgba16float`.
3. Accumulates multiplicative revealage into a second `rgba16float` target.
4. Runs `createWBOITResolveShaderPassPipeline()` to composite the normalized weighted color and
   revealage over `sourceTexture`.

`prepareTranslucent` and `drawTranslucent` are called twice, once with `pass: 'accumulation'` and
once with `pass: 'revealage'`.

## Support

`getWBOITSupport(device)` requires a WebGPU or WebGL2 device on which `rgba16float` is renderable
and blendable. Construction throws the reported reason when support is unavailable.

The two color targets consume 16 bytes per pixel in addition to the internal depth texture.
Unlike A-buffer OIT, memory does not depend on fragment count and no per-pixel sorting is required.
The approximation can lose depth detail in scenes with many strongly overlapping layers.

## Types

```ts
export type WBOITPass = 'accumulation' | 'revealage';

export type WBOITRenderOptions = {
  sourceTexture: Texture;
  prepareOpaqueDepth?: (commandEncoder: CommandEncoder) => void;
  drawOpaqueDepth: (renderPass: RenderPass) => void;
  prepareTranslucent: (context: WBOITCaptureContext) => void;
  drawTranslucent: (renderPass: RenderPass) => void;
};
```

`sourceTexture` must include `Texture.SAMPLE` usage. The renderer records commands but does not
submit the device command encoder.
