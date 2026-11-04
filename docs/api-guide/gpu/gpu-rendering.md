# How GPU rendering works

[Overview](https://luma.gl/docs/api-guide/gpu.md)[Rendering](https://luma.gl/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/docs/api-guide/gpu/gpu-parameters.md)[Bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md)

A draw combines shaders and vertex data with a render target. A `RenderPass` owns the active draw state and target; a `Model` manages the pipeline and bindings for a reusable draw. Start with [Hello Triangle](https://luma.gl/docs/tutorials/hello-triangle.md) for a complete application.

## Draw to a canvas[​](#draw-to-a-canvas "Direct link to Draw to a canvas")

Create a device with `createCanvasContext`, then begin a pass without a framebuffer to target its default canvas:

```
const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

model.draw(renderPass);

renderPass.end();

device.submit();
```

When using `AnimationLoop`, omit `device.submit()` inside `onRender`: the loop submits after the callback returns. Ending a pass finishes encoding; it does not itself submit WebGPU work. See [Issuing GPU commands](https://luma.gl/docs/api-guide/gpu/gpu-commands.md) for explicit command encoders.

A [CanvasContext](https://luma.gl/docs/api-reference/core/canvas-context.md) connects the device to an `HTMLCanvasElement` or `OffscreenCanvas`. When targeting a particular context, obtain its current framebuffer each frame with `canvasContext.getCurrentFramebuffer()` and pass it to `beginRenderPass({framebuffer})`. Do not cache a swap-chain framebuffer across frames. See [Multiple canvases](https://luma.gl/docs/developer-guide/multiple-canvases.md) for presentation to several canvases.

## Draw to a texture[​](#draw-to-a-texture "Direct link to Draw to a texture")

A [Framebuffer](https://luma.gl/docs/api-reference/core/resources/framebuffer.md) groups color and optional depth/stencil attachments. Format strings create framebuffer-owned textures:

```
const framebuffer = device.createFramebuffer({

  width: 512,

  height: 512,

  colorAttachments: ['rgba8unorm'],

  depthStencilAttachment: 'depth24plus'

});



const renderPass = device.beginRenderPass({framebuffer});

model.draw(renderPass);

renderPass.end();

device.submit();



// The framebuffer owns the textures created from format strings.

framebuffer.destroy();
```

To sample the result in a later pass, supply a caller-owned texture created with `Texture.RENDER_ATTACHMENT | Texture.SAMPLE` usage instead. Destroy it separately when finished. Sampler filters control subsequent sampling; they do not make a texture renderable. Check format support through the device before choosing optional render-target formats.

For a new size, use `framebuffer.clone({width, height})` and destroy the old framebuffer. The clone owns its new attachment textures and does not copy their contents; see [Framebuffer ownership](https://luma.gl/docs/api-reference/core/resources/framebuffer.md#methods-and-ownership). Canvas framebuffer sizing is managed by its canvas context.

## Clear or preserve attachments[​](#clear-or-preserve-attachments "Direct link to Clear or preserve attachments")

Clear values are pass properties, not framebuffer properties. The default values are opaque black `[0, 0, 0, 1]`, depth `1`, and stencil `0`. Set `clearColor`, `clearDepth`, or `clearStencil` to boolean `false` to preserve that attachment. Use `clearColors` for separate values on multiple color attachments. See [RenderPassProps](https://luma.gl/docs/api-reference/core/resources/render-pass.md#renderpassprops) for exact types and read-only options.

## Use Core draw commands[​](#use-core-draw-commands "Direct link to Use Core draw commands")

When an Engine model is too high-level, select a pipeline, bindings, and vertex array on the pass, then issue a draw:

```
renderPass.setPipeline(pipeline);

renderPass.setBindings(bindings);

renderPass.setVertexArray(vertexArray);

renderPass.draw({vertexCount: 3});
```

The pipeline declares shaders, vertex layouts, attachment formats, and fixed render state. Create shaders through `device.createShader()`; supply the resulting `Shader` objects when creating a [RenderPipeline](https://luma.gl/docs/api-reference/core/resources/render-pipeline.md). A [VertexArray](https://luma.gl/docs/api-reference/core/resources/vertex-array.md) supplies buffers matching that layout. For most applications, [Model](https://luma.gl/docs/api-reference/engine/model.md) manages this setup.

## Multiple render targets and multisampling[​](#multiple-render-targets-and-multisampling "Direct link to Multiple render targets and multisampling")

Supply several `colorAttachments` to a framebuffer and match the pipeline's color formats. GLSL ES 3.00 uses location-qualified outputs; WGSL uses matching `@location` outputs. All attachments must have compatible dimensions and sample counts.

WebGPU render passes accept `resolveTargets` for resolving multisampled color attachments. See [Antialiasing and multisampling](https://luma.gl/docs/api-guide/gpu/gpu-antialiasing.md) for backend limits, depth handling, and postprocessing choices.

## High-dynamic-range presentation[​](#high-dynamic-range-presentation "Direct link to High-dynamic-range presentation")

Rendering into an `rgba16float` offscreen texture does not automatically produce an HDR image on the display. The final WebGPU canvas must also use a floating-point presentation format and explicitly enable extended tone mapping. Otherwise, the browser clamps displayed colors to the standard `[0, 1]` range even when internal lighting and postprocessing retain brighter values.

Detect whether the current display advertises high dynamic range, then configure the default canvas when creating the device:

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/core/webgpu';



const supportsHighDynamicRange =

  typeof window !== 'undefined' && window.matchMedia('(dynamic-range: high)').matches;



const device = await luma.createDevice({

  adapters: [webgpuAdapter],

  createCanvasContext: supportsHighDynamicRange

    ? {

        colorFormat: 'rgba16float',

        colorSpace: 'display-p3',

        toneMapping: 'extended'

      }

    : true

});



const renderingHighDynamicRange = device.preferredColorFormat === 'rgba16float';
```

The three canvas settings have separate responsibilities:

* `colorFormat: 'rgba16float'` preserves fractional precision and color components above `1.0`.
* `toneMapping: 'extended'` asks WebGPU to display values above SDR white instead of clipping them to the `[0, 1]` presentation range.
* `colorSpace: 'display-p3'` selects a wider display gamut; wide color and HDR luminance are related but independent capabilities.

Applications must preserve that range throughout their rendering pipeline:

1. Keep scene lighting, emissive materials, and intermediate postprocessing in floating-point textures such as `rgba16float`.
2. Match fullscreen render pipelines and presentation targets to `device.preferredColorFormat`.
3. Avoid unconditional `clamp(color, 0.0, 1.0)` in the final shader when HDR presentation is active. Apply an SDR-safe curve to ordinary colors while preserving brighter specular and emissive highlights.
4. Retain the normal 8-bit canvas and SDR tone mapping when the display, browser, or backend cannot present HDR.

`window.matchMedia('(dynamic-range: high)')` identifies display capability, not browser WebGPU canvas support. On browsers exposing `GPUCanvasContext.getConfiguration()`, inspect `configuration.toneMapping?.mode === 'extended'` to verify that extended presentation was accepted. Monitor availability can also change when a window moves between displays.

HDR presentation is WebGPU-specific. WebGL applications can still use floating-point intermediate render targets where supported, but their ordinary presentation canvas remains SDR. Floating-point presentation and intermediate textures also consume more GPU memory than 8-bit formats.

The [Deferred Rendering: Illumination Lab](https://luma.gl/examples/experimental/deferred-rendering) example demonstrates clustered lighting, floating-point postprocessing, configurable highlight intensity, and automatic HDR/SDR presentation selection.
