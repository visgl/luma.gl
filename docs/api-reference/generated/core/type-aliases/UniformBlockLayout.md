# Type Alias: UniformBlockLayout

> **UniformBlockLayout** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:70

Host-side std140 metadata for a named GLSL uniform block.

## Properties[​](#properties "Direct link to Properties")

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:72

GLSL uniform block name.

***

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> **uniformTypes**: `Readonly`<`Record`<`string`, [`CompositeShaderType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CompositeShaderType.md)>>

Defined in: modules/shaders/dist/types/shader-layout.d.ts:74

Ordered member types used to derive the std140 layout.
