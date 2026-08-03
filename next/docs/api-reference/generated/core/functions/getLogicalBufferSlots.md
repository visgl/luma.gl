# Function: getLogicalBufferSlots()

> **getLogicalBufferSlots**(`shaderLayout`, `bufferLayout`): `Record`<`string`, `number`>

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:82](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L82)

Maps logical buffer names to the vertex-array slots implied by a buffer layout.

## Parameters[​](#parameters "Direct link to Parameters")

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

[`ShaderLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Shader-side attribute declarations.

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

[`BufferLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferLayout.md)\[]

Buffer-to-attribute mapping declarations.

## Returns[​](#returns "Direct link to Returns")

`Record`<`string`, `number`>

Vertex-array slot indexes keyed by logical buffer name.
