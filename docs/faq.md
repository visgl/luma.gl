# FAQ


## How do I draw to the screen in luma.gl?

Simply create a `RenderPass` and start rendering.

```typescript
  // A renderpass without parameters uses the default framebuffer of the device's default CanvasContext 
  const renderPass = device.beginRenderPass();
  model.draw(renderPass);
  renderPass.end();
```

Call `device.submit()` after the frame if you want portable end-of-frame behavior. On WebGPU this
submits deferred work to the queue. On WebGL the rendering work already executed during encoding,
so `submit()` mainly finalizes presentation/bookkeeping.

`device.getDefaultCanvasContext().getDefaultFramebuffer()` returns a special framebuffer that lets you render to screen (into the swap chain). This framebuffer is used by default when a `device.beginRenderPass()` is called without providing a `framebuffer`, equivalent to: 

```typescript
  const renderPass = device.beginRenderPass({framebuffer: device.getDefaultCanvasContext().getDefaultFramebuffer()});
  ...
```

## How do I clear the screen in luma.gl?

`Framebuffer` attachments are cleared by default when a RenderPass starts. More control is provided via the `clearColor` parameter, setting this will clear the attachments to the corresponding color. The default clear color is fully transparent `[0, 0, 0, 0]`. Clearing can also be disabled by setting `loadOp='load'`.

```typescript
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
  model.draw(renderPass);
  renderPass.end();
```

Depth and stencil buffers are also cleared to default values:

```typescript
  const renderPass = device.beginRenderPass({
    clearColor: [0, 0, 0, 1],
    depthClearValue: 1,
    stencilClearValue: 0
  });
  renderPass.end();
  device.submit();
```
