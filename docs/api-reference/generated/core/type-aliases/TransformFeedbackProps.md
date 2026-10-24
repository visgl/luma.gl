# Type Alias: TransformFeedbackProps

> **TransformFeedbackProps** = [`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md) & `object`

Defined in: [modules/core/src/adapter/resources/transform-feedback.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/transform-feedback.ts#L19)

Configures a set of output buffers for pipeline (WebGL only)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### buffers[​](#buffers "Direct link to buffers")

> **buffers**: `Record`<`string`, [`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md) | [`BufferRange`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferRange.md)>

Buffer bindings (for varyings)

### layout[​](#layout "Direct link to layout")

> **layout**: [`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Layout of shader (for varyings)
