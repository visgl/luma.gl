# Type Alias: DepthStencilAttachment

> **DepthStencilAttachment** = `object`

Defined in: [modules/core/src/adapter/types/attachments.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L79)

Framebuffer attachments lets the user specify the depth stencil texture that will be used for a RenderPass, together with some additional options for how to clear.

## Properties[​](#properties "Direct link to Properties")

### depthClearValue?[​](#depthclearvalue "Direct link to depthClearValue?")

> `optional` **depthClearValue?**: `number`

Defined in: [modules/core/src/adapter/types/attachments.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L86)

Value to clear depth component to prior to executing the render pass, if depthLoadOp is "clear". 0.0-1.0.

***

### depthLoadOp?[​](#depthloadop "Direct link to depthLoadOp?")

> `optional` **depthLoadOp?**: `"load"` | `"clear"`

Defined in: [modules/core/src/adapter/types/attachments.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L88)

Indicates load operation to perform on depth component prior to executing the render pass. Default 'clear'.

***

### depthReadOnly?[​](#depthreadonly "Direct link to depthReadOnly?")

> `optional` **depthReadOnly?**: `boolean`

Defined in: [modules/core/src/adapter/types/attachments.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L92)

Indicates that the depth component is read only.

***

### depthStoreOp?[​](#depthstoreop "Direct link to depthStoreOp?")

> `optional` **depthStoreOp?**: `"store"` | `"discard"`

Defined in: [modules/core/src/adapter/types/attachments.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L90)

Store operation to perform on depth component after executing the render pass. Default: 'store'.

***

### format?[​](#format "Direct link to format?")

> `optional` **format?**: [`TextureFormatDepthStencil`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md)

Defined in: [modules/core/src/adapter/types/attachments.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L83)

Format of the texture resource. Used to auto create texture if not supplied

***

### stencilClearValue?[​](#stencilclearvalue "Direct link to stencilClearValue?")

> `optional` **stencilClearValue?**: `number`

Defined in: [modules/core/src/adapter/types/attachments.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L95)

Indicates value to clear stencil component to prior to executing the render pass, if stencilLoadOp is "clear".

***

### stencilLoadOp?[​](#stencilloadop "Direct link to stencilLoadOp?")

> `optional` **stencilLoadOp?**: `"load"` | `"clear"`

Defined in: [modules/core/src/adapter/types/attachments.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L97)

Indicates load operation to perform on stencil component prior to executing the render pass. Prefer clearing.

***

### stencilReadOnly?[​](#stencilreadonly "Direct link to stencilReadOnly?")

> `optional` **stencilReadOnly?**: `boolean`

Defined in: [modules/core/src/adapter/types/attachments.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L101)

Indicates that the stencil component is read only.

***

### stencilStoreOp?[​](#stencilstoreop "Direct link to stencilStoreOp?")

> `optional` **stencilStoreOp?**: `"store"` | `"discard"`

Defined in: [modules/core/src/adapter/types/attachments.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L99)

Store operation to perform on stencil component after executing the render pass.

***

### texture?[​](#texture "Direct link to texture?")

> `optional` **texture?**: [`TextureView`](https://luma.gl/next/docs/api-reference/generated/core/classes/TextureView.md) | [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

Defined in: [modules/core/src/adapter/types/attachments.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L81)

Describes the texture subresource that will be output to and read from for this depth/stencil attachment.
