import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# Framebuffer

<CoreDocsTabs group="presentation" active="framebuffer" />

A `Framebuffer` groups color and optional depth/stencil texture views for a
[RenderPass](/docs/api-reference/core/resources/render-pass). Clear values and draw state
belong to the pass. See the [rendering guide](/docs/api-guide/gpu/gpu-rendering) for the workflow.

## Usage

```ts
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

For canvas rendering, obtain the current framebuffer with
`canvasContext.getCurrentFramebuffer()` each frame, or omit the framebuffer to use the
device's default canvas. The canvas context owns those framebuffers.

## Types

### `FramebufferProps`

`FramebufferProps` extends [ResourceProps](resource.md#resourceprops).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width?` | `number` | `1` | Width of attachments created from format strings. |
| `height?` | `number` | `1` | Height of attachments created from format strings. |
| `colorAttachments?` | `(TextureView \| Texture \| TextureFormatColor)[]` | `[]` | Color targets; format strings create owned textures. |
| `depthStencilAttachment?` | `TextureView \| Texture \| TextureFormatDepthStencil \| null` | `null` | Optional depth/stencil target. |

At least one attachment is required. Supplied textures must support render-attachment usage.
Use a `TextureView` to select a mip level or array layer; a `Texture` uses its default view.
Attachment dimensions, formats, and sample counts must be compatible with the pass and pipeline.

## Members

- `device: Device`: the creating device.
- `props: FramebufferProps`: creation properties.
- `width: number`, `height: number`: framebuffer dimensions.
- `colorAttachments: TextureView[]`: resolved color attachment views.
- `depthStencilAttachment: TextureView | null`: resolved depth/stencil view.
- `handle: unknown`: underlying WebGL framebuffer; WebGPU has no native framebuffer object.

## Methods and ownership

### `constructor`

`Framebuffer` is abstract. Create one with `device.createFramebuffer(props)`.
Attachments created from format strings are owned by the framebuffer. Caller-supplied textures
and views are borrowed; the caller must destroy them separately.

### `destroy(): void`

Releases the backend framebuffer and owned attachments. Borrowed attachments remain alive.

### `clone(size?: {width: number; height: number}): Framebuffer`

Creates a framebuffer with new attachment textures, optionally at a new size. Attachment
contents are not copied. The cloned textures are passed as caller-supplied attachments, so
the new framebuffer borrows them. Destroy its attachment textures separately when finished,
as well as the framebuffer. For automatic attachment cleanup, create a new framebuffer
from format strings instead.

### `resize(size?: {width: number; height: number} | [number, number]): void`

Deprecated; prefer `clone()`. Replaces attachments when dimensions change, discarding their
contents. With no argument, recreates attachments at the current size. Borrowed originals
remain the caller's responsibility. Prefer creating a new framebuffer from format strings
when predictable attachment ownership is required.

Do not resize a canvas-owned framebuffer directly.

## Related APIs

- [TextureView](/docs/api-reference/core/resources/texture-view) for selecting subresources.
- [RenderPass](/docs/api-reference/core/resources/render-pass) for clearing and drawing.
- [Antialiasing](/docs/api-guide/gpu/gpu-antialiasing) for `resolveTargets` and backend limits.
