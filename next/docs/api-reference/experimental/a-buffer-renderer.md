# ABufferRenderer

[Overview](https://luma.gl/next/docs/api-reference/experimental.md)[GBuffer](https://luma.gl/next/docs/api-reference/experimental/g-buffer.md)[Deferred Lighting](https://luma.gl/next/docs/api-reference/experimental/deferred-lighting.md)[Clustered Lighting](https://luma.gl/next/docs/api-reference/experimental/clustered-lighting.md)[MLS-MPM Fluid](https://luma.gl/next/docs/api-reference/experimental/mls-mpm-fluid-simulation.md)[Spectral Ocean](https://luma.gl/next/docs/api-reference/experimental/spectral-ocean-simulation.md)[ShadowMapRenderer](https://luma.gl/next/docs/api-reference/experimental/shadow-map-renderer.md)[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass Material](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective Material](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[ABufferRenderer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOITRenderer](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`ABufferRenderer` provides experimental WebGPU-only order-independent transparency for models that append final fragment colors into the `aBuffer` shader module.

The renderer owns the per-frame linked-list buffers and runs two stages:

* one or more translucent capture slices,
* a fullscreen `ShaderPassPipeline` resolve for each captured slice.

## Usage[​](#usage "Direct link to Usage")

```
import {

  Model,

  ShaderInputs

} from '@luma.gl/engine';

import {

  ABufferRenderer,

  aBuffer,

  aBufferPlugin

} from '@luma.gl/experimental';



const shaderInputs = new ShaderInputs({aBuffer});

const renderer = new ABufferRenderer(device, {

  averageFragmentsPerPixel: 4,

  maxFragmentsPerPixel: 12,

  maxBufferByteLength: 64 * 1024 * 1024,

  colorFormat: 'rgba16float'

});



const model = new Model(device, {

  source,

  plugins: [aBufferPlugin],

  shaderInputs

});



// Render opaque color and sampleable depth into an application-owned framebuffer first.

const outputTexture = renderer.render({

  sourceTexture: sceneFramebuffer.colorAttachments[0].texture,

  opaqueDepthTexture: sceneFramebuffer.depthStencilAttachment!,

  prepareTranslucent: ({commandEncoder, shaderModuleProps, captureParameters}) => {

    shaderInputs.setProps({aBuffer: shaderModuleProps});

    model.setParameters({...model.parameters, ...captureParameters});

    model.predraw(commandEncoder);

  },

  drawTranslucent: renderPass => {

    model.draw(renderPass);

  }

});
```

The WGSL fragment shader must pass its final color and `@builtin(position)` into one of the capture helpers:

```
fragColor = aBuffer_captureStraightColor(fragColor, inputs.Position);
```

Use `aBuffer_capturePremultipliedColor` when the shader already outputs premultiplied alpha.

The capture helper samples opaque depth before allocating a fragment record. Translucent fragments behind opaque geometry therefore do not consume A-buffer capacity and cannot bleed through opaque surfaces.

## Shader Module[​](#shader-module "Direct link to Shader Module")

`aBufferPlugin` installs the WebGPU-only `aBuffer` shader module. The module exposes two WGSL helpers:

* `aBuffer_captureStraightColor(color, position)` premultiplies straight-alpha color before capture.
* `aBuffer_capturePremultipliedColor(color, position)` stores an already-premultiplied color.

Both helpers return the supplied color. A model can therefore wrap its existing final fragment color without maintaining a separate capture shader.

The renderer supplies module bindings through `ABufferCaptureContext.shaderModuleProps`. Apply those props to the same `ShaderInputs` instance used by the translucent model before calling `Model.predraw()`.

## Types[​](#types "Direct link to Types")

```
export type ABufferRendererProps = {

  averageFragmentsPerPixel?: number;

  maxFragmentsPerPixel?: number;

  maxBufferByteLength?: number;

  colorFormat?: TextureFormatColor;

};



export type ABufferRenderOptions = {

  sourceTexture: Texture;

  opaqueDepthTexture: TextureView;

  prepareTranslucent: (context: ABufferCaptureContext) => void;

  drawTranslucent: (renderPass: RenderPass) => void;

};
```

`getABufferSupport(device)` reports whether the device provides the required WebGPU fragment-stage storage buffers. `getABufferSlicePlan(...)` exposes the renderer's bounded-memory allocation calculation for diagnostics and tests.

`createABufferResolveShaderPassPipeline({maxFragmentsPerPixel})` exposes the same one-slice fullscreen resolve used internally by `ABufferRenderer`. The renderer invokes it once per captured slice so storage buffers can be reused without allocating full-frame fragment storage.

## Rendering Model[​](#rendering-model "Direct link to Rendering Model")

Each captured fragment occupies 16 bytes: premultiplied RGBA color stored as two packed half-float pairs, depth, and a linked-list pointer. Half-float storage preserves translucent HDR highlights above `1.0` instead of clipping them before resolve. Head pointers use a zero sentinel and fragment pointers are one-based.

For each horizontal slice, the renderer:

1. Clears linked-list heads and allocation counters.
2. Captures visible translucent fragments after sampling opaque depth.
3. Reads at most `maxFragmentsPerPixel` records per pixel.
4. Runs `createABufferResolveShaderPassPipeline()` to sort records back-to-front and composite premultiplied color over the previous slice result.

If storage capacity is exhausted, additional fragments are dropped. If a pixel contains more than `maxFragmentsPerPixel`, only that many linked-list records are composited.

## Remarks[​](#remarks "Direct link to Remarks")

* `ABufferRenderer` requires WebGPU and single-sample source color/depth textures. Source color must include `Texture.SAMPLE | Texture.RENDER`; opaque depth must include `Texture.SAMPLE`.
* `colorFormat` controls the resolved output texture and defaults to the canvas-preferred format. Set it to a supported, filterable `rgba16float` format to preserve both opaque HDR source color and captured translucent HDR highlights through compositing before bloom or tone mapping.
* The base pass depth texture is sampled during translucent capture so fragments behind opaque geometry are rejected before linked-list storage writes.
* The renderer does not submit the device command encoder; the surrounding render loop keeps that responsibility.
* `prepareTranslucent` runs once per horizontal capture slice. Update A-buffer shader props and call `Model.predraw()` there before the render pass opens.
* Merge `captureParameters` after the model's regular parameters. It disables color writes and removes depth/stencil pipeline state because capture runs without a depth attachment. Opaque-depth comparison happens in the A-buffer shader module.
* `maxBufferByteLength` caps each storage buffer. Targets that exceed the budget are rendered in horizontal slices.
* Exactness is bounded by the configured fragment capacity and `maxFragmentsPerPixel`.
