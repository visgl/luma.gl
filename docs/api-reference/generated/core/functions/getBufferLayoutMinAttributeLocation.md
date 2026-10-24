# Function: getBufferLayoutMinAttributeLocation()

> **getBufferLayoutMinAttributeLocation**(`bufferLayout`, `shaderLayout`): `number`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:193](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L193)

Returns the minimum attribute location referenced by a logical buffer layout.

## Parameters[​](#parameters "Direct link to Parameters")

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

[`BufferLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferLayout.md)

One logical buffer layout.

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

[`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Shader-side attribute declarations.

## Returns[​](#returns "Direct link to Returns")

`number`

The lowest shader location referenced by the layout.
