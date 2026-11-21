# Function: getShaderAttributeLocationMap()

> **getShaderAttributeLocationMap**(`shaderLayout`): `Record`<`string`, `number` | `undefined`>

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L51)

Builds a lookup table from shader attribute name to source location.

## Parameters[​](#parameters "Direct link to Parameters")

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

[`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Shader-side attribute declarations.

## Returns[​](#returns "Direct link to Returns")

`Record`<`string`, `number` | `undefined`>

Attribute locations keyed by attribute name.
