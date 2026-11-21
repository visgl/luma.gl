# Function: resolveLogicalAttributeMappings()

> **resolveLogicalAttributeMappings**(`shaderLayout`, `bufferLayout`, `options?`): [`LogicalAttributeMapping`](https://luma.gl/docs/api-reference/generated/core/type-aliases/LogicalAttributeMapping.md)\[]

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L113)

Resolves backend-agnostic logical attribute mappings from a shader layout and buffer layout.

## Parameters[​](#parameters "Direct link to Parameters")

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

[`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Shader-side attribute declarations.

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

[`BufferLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferLayout.md)\[]

Buffer-to-attribute mapping declarations.

### options?[​](#options "Direct link to options?")

`ResolveLogicalAttributeMappingsOptions`

Optional warning controls.

## Returns[​](#returns "Direct link to Returns")

[`LogicalAttributeMapping`](https://luma.gl/docs/api-reference/generated/core/type-aliases/LogicalAttributeMapping.md)\[]

One logical mapping per shader attribute, ordered by shader location.
