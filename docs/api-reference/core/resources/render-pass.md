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

## Types

### `RenderPassProps`

| Property        | Type                 | Default        | Description                                               |
| --------------- | -------------------- | -------------- | --------------------------------------------------------- |
| `framebuffer?`  | `Framebuffer`        |                | Provides render target textures and depth/stencil texture |
| `parameters?`   | `Parameters`         |                | GPU pipeline parameters                                   |
| `clearColor?`   | `number[]`, `'load'` | `[0, 0, 0, 0]` |                                                           |
| `clearDepth?`   | `number`, `'load'`   | `1`            |                                                           |
| `clearStencil?` | `number`, `'load'`   | `0`            |                                                           |

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
