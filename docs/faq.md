# FAQ

## How do I draw to the screen?

Create a device with a default canvas context, then draw a model into a render pass:

```ts
const renderPass = device.beginRenderPass();
model.draw(renderPass);
renderPass.end();
device.submit();
```

An `AnimationLoop` submits the device's default encoder after `onRender` returns,
so omit the explicit submission inside that callback. See the
[rendering workflow](/docs/api-guide/gpu/gpu-rendering).

## How do I clear or preserve the previous frame?

Pass `clearColor`, `clearDepth`, and `clearStencil` to `beginRenderPass()`.
Set a clear property to boolean `false` to preserve that attachment.
The defaults are opaque black, depth `1`, and stencil `0`.
See [RenderPass options](/docs/api-reference/core/resources/render-pass#renderpassprops).

## Which packages and backend should I use?

Start with [Getting started](/docs/getting-started) for a portable triangle.
Use [Choosing an API layer](/docs/api-guide) to decide between Engine, Core,
Shadertools, and experimental GPU Core. Check
[WebGPU versus WebGL 2](/docs/api-guide/background/webgpu-vs-webgl)
before depending on compute or other backend-specific features.
