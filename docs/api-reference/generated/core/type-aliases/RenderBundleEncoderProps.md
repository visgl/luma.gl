# Type Alias: RenderBundleEncoderProps

> **RenderBundleEncoderProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L15)

Properties used to configure a [RenderBundleEncoder](https://luma.gl/docs/api-reference/generated/core/classes/RenderBundleEncoder.md).

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### colorAttachmentFormats?[​](#colorattachmentformats "Direct link to colorAttachmentFormats?")

> `optional` **colorAttachmentFormats?**: ([`TextureFormatColor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormatColor.md) | `null`)\[]

Color attachment formats required by render passes that execute the finished bundle.

#### Default Value[​](#default-value "Direct link to Default Value")

`[device.preferredColorFormat]`

### depthReadOnly?[​](#depthreadonly "Direct link to depthReadOnly?")

> `optional` **depthReadOnly?**: `boolean`

Whether the depth component is read-only while the bundle executes.

#### Default Value[​](#default-value-1 "Direct link to Default Value")

`false`

### depthStencilAttachmentFormat?[​](#depthstencilattachmentformat "Direct link to depthStencilAttachmentFormat?")

> `optional` **depthStencilAttachmentFormat?**: [`TextureFormatDepthStencil`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormatDepthStencil.md) | `false`

Depth/stencil attachment format required by render passes that execute the finished bundle. Set to `false` when the bundle does not use a depth/stencil attachment.

#### Default Value[​](#default-value-2 "Direct link to Default Value")

`device.preferredDepthFormat`

### sampleCount?[​](#samplecount "Direct link to sampleCount?")

> `optional` **sampleCount?**: `number`

Sample count required by render passes that execute the finished bundle. Multisampled render bundles are not currently supported, so this must be `1`.

#### Default Value[​](#default-value-3 "Direct link to Default Value")

`1`

### stencilReadOnly?[​](#stencilreadonly "Direct link to stencilReadOnly?")

> `optional` **stencilReadOnly?**: `boolean`

Whether the stencil component is read-only while the bundle executes.

#### Default Value[​](#default-value-4 "Direct link to Default Value")

`false`
