# RenderPass

[Issuing Commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md)[CommandEncoder](https://luma.gl/next/docs/api-reference/core/resources/command-encoder.md)[RenderPass](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md)[RenderBundleEncoder](https://luma.gl/next/docs/api-reference/core/resources/render-bundle-encoder.md)[ComputePass](https://luma.gl/next/docs/api-reference/core/resources/compute-pass.md)

## Usage[​](#usage "Direct link to Usage")

To draw to the screen in luma.gl, simply create a `RenderPass` by calling `device.beginRenderPass()` and start rendering. When done rendering, call `renderPass.end()`

```
  // A renderpass without parameters uses the default framebuffer of the device's default CanvasContext 

  const renderPass = device.beginRenderPass();

  model.draw(renderPass);

  renderPass.end();

  device.submit();
```

`device.getDefaultCanvasContext().getDefaultFramebuffer()` returns a special framebuffer that lets you render to screen (into the swap chain). This framebuffer is used by default when a `device.beginRenderPass()` is called without providing a `framebuffer`, equivalent to:

```
  const renderPass = device.beginRenderPass({framebuffer: device.getDefaultCanvasContext().getDefaultFramebuffer()});

  ...
```

### Clearing the screen[​](#clearing-the-screen "Direct link to Clearing the screen")

`Framebuffer` attachments are cleared by default when a RenderPass starts. More control is provided via the `clearColor` parameter, setting this will clear the attachments to the corresponding color. The default clear color is `[0, 0, 0, 1]`. Clearing can also be disabled by setting `loadOp='load'`.

```
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});

  model.draw(renderPass);

  renderPass.end();

  device.submit();
```

Depth and stencil buffers are also cleared to default values:

```
  const renderPass = device.beginRenderPass({

    clearColor: [0, 0, 0, 1],

    clearDepth: 1,

    clearStencil: 0

  });

  renderPass.end();

  device.submit();
```

### Viewport size[​](#viewport-size "Direct link to Viewport size")

`RenderPassProps.parameters.viewport` controls how the rendered graphics is mapped to window pixels / texels (more precisely, the affine transformation of x and y from normalized device coordinates to window coordinates).

If no value for the `viewport` parameter is provided, the following defaults will be applied.

* If no `framebuffer` is specified, the size of the canvas drawing buffer will be used (`device.getCanvasContext().getDrawingBufferSize()`)
* If a framebuffer is specified, the `width` and `height` of the framebuffer will be used.

## Types[​](#types "Direct link to Types")

### `RenderPassProps`[​](#renderpassprops "Direct link to renderpassprops")

`RenderPassProps` extends [`ResourceProps`](https://luma.gl/next/docs/api-reference/core/resources/resource.md#resourceprops) and accepts the following fields.

| Property               | Type                                  | Default        | Description                                                                                                   |
| ---------------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `framebuffer?`         | `Framebuffer \| null`                 | `null`         | Render target that receives the output of the pass. When omitted, the default canvas framebuffer is used.     |
| `parameters?`          | `RenderPassParameters`                | `undefined`    | Mutable pipeline parameters such as viewport, scissor rectangle, blend constant and stencil reference.        |
| `clearColor?`          | `NumberArray4 \| TypedArray \| false` | `[0, 0, 0, 1]` | Color used to clear the default color attachment. Set to `false` to preserve the previous value.              |
| `clearColors?`         | `(TypedArray \| false)[]`             | `undefined`    | Per-attachment clear values for multiple color attachments. Takes precedence over `clearColor` when provided. |
| `clearDepth?`          | `number \| false`                     | `1`            | Depth value used when clearing the depth attachment. Set to `false` to preserve the previous depth.           |
| `clearStencil?`        | `number \| false`                     | `0`            | Stencil value used when clearing the stencil attachment. Set to `false` to preserve the previous stencil.     |
| `depthReadOnly?`       | `boolean`                             | `false`        | Marks the depth attachment as read-only for the duration of the pass.                                         |
| `stencilReadOnly?`     | `boolean`                             | `false`        | Marks the stencil attachment as read-only for the duration of the pass.                                       |
| `discard?`             | `boolean`                             | `false`        | Disables rasterization output when set to `true`.                                                             |
| `occlusionQuerySet?`   | `QuerySet`                            | `undefined`    | Query set that records occlusion query results generated by the pass.                                         |
| `timestampQuerySet?`   | `QuerySet`                            | `undefined`    | Query set that will receive timestamps at the beginning and end of the pass.                                  |
| `beginTimestampIndex?` | `number`                              | `undefined`    | Query set index that records the timestamp when the pass begins.                                              |
| `endTimestampIndex?`   | `number`                              | `undefined`    | Query set index that records the timestamp when the pass ends.                                                |

## Members[​](#members "Direct link to Members")

* `device`: `Device` - holds a reference to the `Device` that created this `RenderPass`.
* `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
* `props`: `RenderPassProps` - holds a copy of the `RenderPassProps` used to create this `RenderPass`.

## Methods[​](#methods "Direct link to Methods")

### `constructor()`[​](#constructor "Direct link to constructor")

`RenderPass` is an abstract class and cannot be instantiated directly. Create with `device.beginRenderPass(...)`.

### `end(): void`[​](#end-void "Direct link to end-void")

Must be called after all draw calls have been completed to guarantee rendering. Frees up any GPU resources associated with this render pass.

### `setPipeline(pipeline: RenderPipeline): void`[​](#setpipelinepipeline-renderpipeline-void "Direct link to setpipelinepipeline-renderpipeline-void")

Selects the immutable render pipeline used by subsequent commands.

### `setBindings(bindings: Bindings | BindingsByGroup): void`[​](#setbindingsbindings-bindings--bindingsbygroup-void "Direct link to setbindingsbindings-bindings--bindingsbygroup-void")

Replaces the complete binding set used by subsequent draws. Call `setPipeline()` first so luma.gl can resolve binding names against the active shader layout.

### `setVertexArray(vertexArray: VertexArray): void`[​](#setvertexarrayvertexarray-vertexarray-void "Direct link to setvertexarrayvertexarray-vertexarray-void")

Selects the vertex and index data used by subsequent draws.

### `draw(options: RenderPassDrawOptions): boolean`[​](#drawoptions-renderpassdrawoptions-boolean "Direct link to drawoptions-renderpassdrawoptions-boolean")

Draws with the active pipeline, bindings, and vertex array. `options` contains draw counts and offsets such as `vertexCount`, `indexCount`, `instanceCount`, `firstVertex`, and `firstIndex`.

```
renderPass.setPipeline(pipeline);

renderPass.setBindings({frameUniforms, materialUniforms});

renderPass.setVertexArray(vertexArray);

renderPass.draw({vertexCount: 3});
```

### `drawIndirect(indirectBuffer: Buffer, indirectByteOffset?: number): void`[​](#drawindirectindirectbuffer-buffer-indirectbyteoffset-number-void "Direct link to drawindirectindirectbuffer-buffer-indirectbyteoffset-number-void")

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

Draws using four packed `uint32` arguments beginning at `indirectByteOffset`: `vertexCount`, `instanceCount`, `firstVertex`, and `firstInstance`. The buffer requires `Buffer.INDIRECT` usage.

### `drawIndexedIndirect(indirectBuffer: Buffer, indirectByteOffset?: number): void`[​](#drawindexedindirectindirectbuffer-buffer-indirectbyteoffset-number-void "Direct link to drawindexedindirectindirectbuffer-buffer-indirectbyteoffset-number-void")

Draws indexed geometry using five packed 32-bit arguments: `indexCount`, `instanceCount`, `firstIndex`, signed `baseVertex`, and `firstInstance`. The record occupies 20 bytes.

### `executeBundles(bundles: Iterable<RenderBundle>): void`[​](#executebundlesbundles-iterablerenderbundle-void "Direct link to executebundlesbundles-iterablerenderbundle-void")

![From-v9.4](https://img.shields.io/badge/From-v9.4-blue.svg?style=flat-square)![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

Replays previously recorded `RenderBundle` objects from a [`RenderBundleEncoder`](https://luma.gl/next/docs/api-reference/core/resources/render-bundle-encoder.md) in this render pass.

### `pushDebugGroup(groupLabel: string): void`[​](#pushdebuggroupgrouplabel-string-void "Direct link to pushdebuggroupgrouplabel-string-void")

Adds a debug group (implementation dependent).

### `popDebugGroup(): void`[​](#popdebuggroup-void "Direct link to popdebuggroup-void")

Removes a debug group (implementation dependent).

### `insertDebugMarker(markerLabel: string): void`[​](#insertdebugmarkermarkerlabel-string-void "Direct link to insertdebugmarkermarkerlabel-string-void")

Adds a debug marker (implementation dependent).
