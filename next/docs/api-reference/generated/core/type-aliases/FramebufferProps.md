# Type Alias: FramebufferProps

> **FramebufferProps** = [`DeviceResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceResourceProps.md) & `object`

Defined in: [modules/core/src/api/adapter/resources/framebuffer.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/framebuffer.ts#L16)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### colorAttachments?[​](#colorattachments "Direct link to colorAttachments?")

> `optional` **colorAttachments?**: ([`TextureView`](https://luma.gl/next/docs/api-reference/generated/core/classes/TextureView.md) | [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md) | [`TextureFormatColor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatColor.md))\[]

### depthStencilAttachment?[​](#depthstencilattachment "Direct link to depthStencilAttachment?")

> `optional` **depthStencilAttachment?**: [`TextureView`](https://luma.gl/next/docs/api-reference/generated/core/classes/TextureView.md) | [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md) | [`TextureFormatDepthStencil`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md) | `null`

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

### samples?[​](#samples "Direct link to samples?")

> `optional` **samples?**: `1` | `4`

Sample count for automatically allocated offscreen render storage.

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`
