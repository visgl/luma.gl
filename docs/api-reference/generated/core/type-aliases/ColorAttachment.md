# Type Alias: ColorAttachment

> **ColorAttachment** = `object`

Defined in: [modules/core/src/adapter/types/attachments.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L59)

Framebuffer attachments lets the user specify the textures that will be used for a RenderPass, together with some additional options for how to clear.

## Properties[​](#properties "Direct link to Properties")

### clearValue?[​](#clearvalue "Direct link to clearValue?")

> `optional` **clearValue?**: `number`\[]

Defined in: [modules/core/src/adapter/types/attachments.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L68)

Value to clear to prior to executing the render pass. Default: \[0, 0, 0, 0]. Ignored if loadOp is not "clear".

***

### format?[​](#format "Direct link to format?")

> `optional` **format?**: [`TextureFormatColor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormatColor.md)

Defined in: [modules/core/src/adapter/types/attachments.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L63)

Format of the texture resource. Used to auto create texture if not supplied

***

### loadOp?[​](#loadop "Direct link to loadOp?")

> `optional` **loadOp?**: `"load"` | `"clear"`

Defined in: [modules/core/src/adapter/types/attachments.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L70)

load operation to perform on texture prior to executing the render pass. Default: 'clear'.

***

### storeOp?[​](#storeop "Direct link to storeOp?")

> `optional` **storeOp?**: `"store"` | `"discard"`

Defined in: [modules/core/src/adapter/types/attachments.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L72)

The store operation to perform on texture after executing the render pass. Default: 'store'.

***

### texture?[​](#texture "Direct link to texture?")

> `optional` **texture?**: [`TextureView`](https://luma.gl/docs/api-reference/generated/core/classes/TextureView.md) | [`Texture`](https://luma.gl/docs/api-reference/generated/core/classes/Texture.md)

Defined in: [modules/core/src/adapter/types/attachments.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/attachments.ts#L61)

Describes the texture subresource that will be output to for this color attachment.
