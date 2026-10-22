# FAQ

## How do I draw to the screen?[​](#how-do-i-draw-to-the-screen "Direct link to How do I draw to the screen?")

Create a device with a default canvas context, then draw a model into a render pass:

```
const renderPass = device.beginRenderPass();

model.draw(renderPass);

renderPass.end();

device.submit();
```

An `AnimationLoop` submits the device's default encoder after `onRender` returns, so omit the explicit submission inside that callback. See the [rendering workflow](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md).

## How do I clear or preserve the previous frame?[​](#how-do-i-clear-or-preserve-the-previous-frame "Direct link to How do I clear or preserve the previous frame?")

Pass `clearColor`, `clearDepth`, and `clearStencil` to `beginRenderPass()`. Set a clear property to boolean `false` to preserve that attachment. The defaults are opaque black, depth `1`, and stencil `0`. See [RenderPass options](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md#renderpassprops).

## Which packages and backend should I use?[​](#which-packages-and-backend-should-i-use "Direct link to Which packages and backend should I use?")

Start with [Getting started](https://luma.gl/next/docs/getting-started.md) for a portable triangle. Use [Choosing an API layer](https://luma.gl/next/docs/api-guide.md) to decide between Engine, Core, Shadertools, and experimental GPU Core. Check [WebGPU versus WebGL 2](https://luma.gl/next/docs/api-guide/background/webgpu-vs-webgl.md) before depending on compute or other backend-specific features.
