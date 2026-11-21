# Type Alias: UniformBlockLayout

> **UniformBlockLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L97)

Host-side std140 metadata for a named GLSL uniform block.

## Properties[​](#properties "Direct link to Properties")

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L99)

GLSL uniform block name.

***

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> **uniformTypes**: `Readonly`<`Record`<`string`, [`CompositeShaderType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CompositeShaderType.md)>>

Defined in: [modules/core/src/adapter/types/shader-layout.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L101)

Ordered member types used to derive the std140 layout.
