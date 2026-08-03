# Type Alias: RenderPassProps

> **RenderPassProps** = [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L57)

Properties for a RenderPass instance is a required parameter to all draw calls.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### beginTimestampIndex?[​](#begintimestampindex "Direct link to beginTimestampIndex?")

> `optional` **beginTimestampIndex?**: `number`

QuerySet index to write begin timestamp to. No timestamp is written if not provided.

### clearColor?[​](#clearcolor "Direct link to clearColor?")

> `optional` **clearColor?**: `NumberArray4` | [`TypedArray`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TypedArray.md) | `false`

Clear value for color attachment, or false to preserve the previous value

### clearColors?[​](#clearcolors "Direct link to clearColors?")

> `optional` **clearColors?**: ([`TypedArray`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TypedArray.md) | `false`)\[]

Experimental: Clear color values for multiple color attachments. Must specify typed arrays. props.clearColor will be ignored.

### clearDepth?[​](#cleardepth "Direct link to clearDepth?")

> `optional` **clearDepth?**: `number` | `false`

Clear value for depth attachment (true === `1`), or false to preserve the previous value. Must be between 0.0 (near) and 1.0 (far), inclusive.

### clearStencil?[​](#clearstencil "Direct link to clearStencil?")

> `optional` **clearStencil?**: `number` | `false`

Clear value for stencil attachment (true === `0`), or false to preserve the previous value. Converted to the type and number of LSBs as the number of bits in the stencil aspect

### depthReadOnly?[​](#depthreadonly "Direct link to depthReadOnly?")

> `optional` **depthReadOnly?**: `boolean`

Indicates that the depth component is read only.

### discard?[​](#discard "Direct link to discard?")

> `optional` **discard?**: `boolean`

Whether to disable / discard the output of the rasterizer

### endTimestampIndex?[​](#endtimestampindex "Direct link to endTimestampIndex?")

> `optional` **endTimestampIndex?**: `number`

QuerySet index to write end timestamp to. No timestamp is written if not provided.

### framebuffer?[​](#framebuffer "Direct link to framebuffer?")

> `optional` **framebuffer?**: [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md) | `null`

Framebuffer specifies which textures to render into. Default gets framebuffer from canvas context.

### occlusionQuerySet?[​](#occlusionqueryset "Direct link to occlusionQuerySet?")

> `optional` **occlusionQuerySet?**: [`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md)

QuerySet to write begin/end timestamps to

### parameters?[​](#parameters "Direct link to parameters?")

> `optional` **parameters?**: [`RenderPassParameters`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPassParameters.md)

Control viewport, scissor rect, blend constant and stencil ref

### resolveTargets?[​](#resolvetargets "Direct link to resolveTargets?")

> `optional` **resolveTargets?**: ([`TextureView`](https://luma.gl/next/docs/api-reference/generated/core/classes/TextureView.md) | `null`)\[]

Optional single-sample targets receiving resolved multisampled color attachments. WebGPU only.

### stencilReadOnly?[​](#stencilreadonly "Direct link to stencilReadOnly?")

> `optional` **stencilReadOnly?**: `boolean`

Indicates that the stencil component is read only.

### timestampQuerySet?[​](#timestampqueryset "Direct link to timestampQuerySet?")

> `optional` **timestampQuerySet?**: [`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md)

QuerySet to write begin/end timestamps to
