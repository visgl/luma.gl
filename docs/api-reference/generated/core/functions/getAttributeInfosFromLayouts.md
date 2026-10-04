# Function: getAttributeInfosFromLayouts()

> **getAttributeInfosFromLayouts**(`shaderLayout`, `bufferLayout`): `Record`<`string`, [`AttributeInfo`](https://luma.gl/docs/api-reference/generated/core/type-aliases/AttributeInfo.md)>

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L54)

Map from "attribute names" to "resolved attribute infos" containing information about both buffer layouts and shader attribute declarations

## Parameters[​](#parameters "Direct link to Parameters")

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

[`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

[`BufferLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferLayout.md)\[]

## Returns[​](#returns "Direct link to Returns")

`Record`<`string`, [`AttributeInfo`](https://luma.gl/docs/api-reference/generated/core/type-aliases/AttributeInfo.md)>
