# RenderPass


## Usage

To draw to the screen in luma.gl, simply create a `RenderPass` by calling 
`device.beginRenderPass()` and start rendering. When done rendering, call 
`renderPass.end()`  

```typescript
  // A renderpass without parameters uses the default framebuffer of the device's default CanvasContext 
  const renderPass = device.beginRenderPass();
  model.draw();
  renderPass.end();
  device.submit();
```

`device.canvasContext.getDefaultFramebuffer()` returns a special framebuffer that lets you render to screen (into the swap chain). This framebuffer is used by default when a `device.beginRenderPass()` is called without providing a `framebuffer`, equivalent to: 

```typescript
  const renderPass = device.beginRenderPass({framebuffer: device.canvasContext.getDefaultFramebuffer()});
  ...
```

## Clearing the screen

`Framebuffer` attachments are cleared by default when a RenderPass starts. More control is provided via the `clearColor` parameter, setting this will clear the attachments to the corresponding color. The default clear color is fully transparent `[0, 0, 0, 0]`. Clearing can also be disabled by setting `loadOp='load'`.

```typescript
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
  model.draw();
  renderPass.end();
  device.submit();
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

## Viewport size

`RenderPassProps.parameters.viewport` controls how the rendered graphics is mapped to window pixels / texels (more precisely, the affine transformation of x and y from normalized device coordinates to window coordinates).

If no value for the `viewport` parameter is provided, the following defaults will be applied.
- If no `framebuffer` is specified, the size of the canvas drawing buffer will be used (`[gl.canvas.drawingBufferWidth, gl.canvas.drawingBufferHeight]`)
- If a framebuffer is specified, the `width` and `height` of the framebuffer will be used.

## Types

### `RenderPassProps`

| Property             | Type                   | Default        | Description                                                                                               |
| -------------------- | ---------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `framebuffer?`       | `Framebuffer`          |  N/A              | Provides render target textures and depth/stencil texture                                                 |
| `parameters?`        | `Parameters`           |                | GPU pipeline parameters                                                                                   |
| `clearColor?`        | `number[] \| false`    | `[0, 0, 0, 0]` |                                                                                                           |
| `loadOp`?            | `'load'`, `'clear'`    | `'clear'`      | Load operation to perform on texture prior to executing the render pass. Default: 'clear'.                |
| `storeOp`?           | `'store'`, `'discard'` | `'store'`      | The store operation to perform on texture after executing the render pass. Default: 'store'.              |
| `depthClearValue`?   | `number`               | `1`            | Value to clear depth component to prior to executing the render pass, if depthLoadOp is "clear". 0.0-1.0. |
| `depthLoadOp`?       | `'load'`, `'clear'`    |                | Load operation to perform on depth component prior to executing the render pass. Default 'clear'.         |
| `depthStoreOp`?      | `'store'`, `'discard'` |                | Store operation` to perform on depth component after executing the render pass. Default 'store'.          |
| `depthReadOnly`?     | `boolean`              |                | Depth component is read only.                                                                             |
| `stencilClearValue`? | `number `              |                | Value to clear stencil component to prior to executing the render pass, if stencilLoadOp is "clear".      |
| `stencilLoadOp`?     | `'clear'`, `'load'`    |                | Load operation to perform on stencil component prior to executing the render pass. Prefer clearing.       |
| `stencilStoreOp`?    | `'store'`, `'discard'` |                | Store operation to perform on stencil component after executing the render pass.                          |
| `stencilReadOnly`?   | `boolean`              |                | Stencil component is read only.                                                                           |

- Clearing can be disabled by setting `loadOp='load'` however this may have a small performance cost as GPUs are optimized for clearing.
- WebGL does not support setting `storeOp: 'discard'` for just some attachments, it is all or nothing.
- Currently luma.gl doesn't support specifying per-rendertarget properties

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `RenderPass`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `RenderPassProps` - holds a copy of the `RenderPassProps` used to create this `RenderPass`.

## Methods

### `constructor()`

`RenderPass` is an abstract class and cannot be instantiated directly. Create with `device.beginRenderPass(...)`.

### `endPass(): void`

Must be called after all draw calls have been completed to guarantee rendering. Frees up any GPU resources associated with this render pass.

### `pushDebugGroup(groupLabel: string): void`

Adds a debug group (implementation dependent).

### `popDebugGroup(): void`

Removes a debug group (implementation dependent).

### `insertDebugMarker(markerLabel: string): void`

Adds a debug marker (implementation dependent).
