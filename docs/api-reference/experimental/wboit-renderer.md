# WBOITRenderer

`WBOITRenderer` implements weighted blended order-independent transparency on WebGPU and WebGL2.
It owns floating-point accumulation and revealage targets, records the required passes, and
composites a premultiplied result over the opaque target.

## Usage

```ts
import {Model, ShaderInputs} from '@luma.gl/engine';
import {
  WBOITRenderer,
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

renderer.render({
  clearColor: [0, 0, 0, 1],
  clearDepth: 1,
  prepareBase: commandEncoder => opaqueModel.predraw(commandEncoder),
  drawBase: renderPass => opaqueModel.draw(renderPass),
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

## Rendering Model

For each frame the renderer:

1. Draws the opaque scene into the destination target.
2. Draws opaque depth into an internal depth target shared by both capture passes.
3. Accumulates weighted premultiplied color and weighted alpha into `rgba16float`.
4. Accumulates multiplicative revealage into a second `rgba16float` target.
5. Composites the normalized weighted color and revealage over the destination.

`drawOpaqueDepth` may provide an optimized depth-only scene callback. When omitted, `drawBase` is
called a second time for the internal depth pass. `prepareTranslucent` and `drawTranslucent` are
called twice, once with `pass: 'accumulation'` and once with `pass: 'revealage'`.

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
  framebuffer?: Framebuffer | null;
  clearColor?: NumberArray4 | false;
  clearDepth?: number | false;
  prepareBase?: (commandEncoder: CommandEncoder) => void;
  drawBase: (renderPass: RenderPass) => void;
  drawOpaqueDepth?: (renderPass: RenderPass) => void;
  prepareTranslucent: (context: WBOITCaptureContext) => void;
  drawTranslucent: (renderPass: RenderPass) => void;
};
```

The renderer records commands but does not submit the device command encoder.
