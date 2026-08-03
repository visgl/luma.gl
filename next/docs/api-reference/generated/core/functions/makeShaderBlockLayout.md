# Function: makeShaderBlockLayout()

> **makeShaderBlockLayout**(`uniformTypes`, `options?`): [`ShaderBlockLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md)

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L68)

Builds a deterministic shader-block layout from composite shader type declarations.

The returned value is pure layout metadata. It records the packed field offsets and exact packed byte length, but it does not allocate buffers or serialize values.

## Parameters[​](#parameters "Direct link to Parameters")

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

`Readonly`<`Record`<`string`, [`CompositeShaderType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompositeShaderType.md)>>

### options?[​](#options "Direct link to options?")

[`ShaderBlockLayoutOptions`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayoutOptions.md) = `{}`

## Returns[​](#returns "Direct link to Returns")

[`ShaderBlockLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md)
