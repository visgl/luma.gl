# Framebuffer

[CanvasContext](https://luma.gl/next/docs/api-reference/core/canvas-context.md)[PresentationContext](https://luma.gl/next/docs/api-reference/core/presentation-context.md)[Framebuffer](https://luma.gl/next/docs/api-reference/core/resources/framebuffer.md)

A `Framebuffer` groups color and optional depth/stencil texture views for a [RenderPass](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md). Clear values and draw state belong to the pass. See the [rendering guide](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md) for the workflow.

## Usage[​](#usage "Direct link to Usage")

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



framebuffer.destroy();
```

For canvas rendering, obtain the current framebuffer with `canvasContext.getCurrentFramebuffer()` each frame, or omit the framebuffer to use the device's default canvas. The canvas context owns those framebuffers.

## Types[​](#types "Direct link to Types")

### `FramebufferProps`[​](#framebufferprops "Direct link to framebufferprops")

`FramebufferProps` extends [ResourceProps](https://luma.gl/next/docs/api-reference/core/resources/resource.md#resourceprops).

| Property                  | Type                                                          | Default | Description                                          |
| ------------------------- | ------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| `width?`                  | `number`                                                      | `1`     | Width of attachments created from format strings.    |
| `height?`                 | `number`                                                      | `1`     | Height of attachments created from format strings.   |
| `colorAttachments?`       | `(TextureView \| Texture \| TextureFormatColor)[]`            | `[]`    | Color targets; format strings create owned textures. |
| `depthStencilAttachment?` | `TextureView \| Texture \| TextureFormatDepthStencil \| null` | `null`  | Optional depth/stencil target.                       |

At least one attachment is required. Supplied textures must support render-attachment usage. Use a `TextureView` to select a mip level or array layer; a `Texture` uses its default view. Attachment dimensions, formats, and sample counts must be compatible with the pass and pipeline.

## Members[​](#members "Direct link to Members")

* `device: Device`: the creating device.
* `props: FramebufferProps`: creation properties.
* `width: number`, `height: number`: framebuffer dimensions.
* `colorAttachments: TextureView[]`: resolved color attachment views.
* `depthStencilAttachment: TextureView | null`: resolved depth/stencil view.
* `handle: unknown`: underlying WebGL framebuffer; WebGPU has no native framebuffer object.

## Methods and ownership[​](#methods-and-ownership "Direct link to Methods and ownership")

### `constructor`[​](#constructor "Direct link to constructor")

`Framebuffer` is abstract. Create one with `device.createFramebuffer(props)`. Attachments created from format strings are owned by the framebuffer. Caller-supplied textures and views are borrowed; the caller must destroy them separately.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Releases the backend framebuffer and owned attachments. Borrowed attachments remain alive.

### `clone(size?: {width: number; height: number}): Framebuffer`[​](#clonesize-width-number-height-number-framebuffer "Direct link to clonesize-width-number-height-number-framebuffer")

Creates a framebuffer with new attachment textures, optionally at a new size. Attachment contents are not copied. The new framebuffer owns its cloned attachment textures and destroys them with `destroy()`. Destroy the previous framebuffer when it is no longer needed.

### `resize(size?: {width: number; height: number} | [number, number]): void`[​](#resizesize-width-number-height-number--number-number-void "Direct link to resizesize-width-number-height-number--number-number-void")

Deprecated; prefer `clone()`. Replaces attachments when dimensions change, discarding their contents. With no argument, recreates attachments at the current size. The framebuffer owns the replacement textures. Borrowed originals remain the caller's responsibility.

Do not resize a canvas-owned framebuffer directly.

## Related APIs[​](#related-apis "Direct link to Related APIs")

* [TextureView](https://luma.gl/next/docs/api-reference/core/resources/texture-view.md) for selecting subresources.
* [RenderPass](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md) for clearing and drawing.
* [Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md) for `resolveTargets` and backend limits.
