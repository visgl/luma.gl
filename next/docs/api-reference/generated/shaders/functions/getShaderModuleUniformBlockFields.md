# Function: getShaderModuleUniformBlockFields()

> **getShaderModuleUniformBlockFields**(`module`, `stage`): `string`\[] | `null`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L83)

Returns the ordered field names parsed from a shader module's uniform block.

## Parameters[​](#parameters "Direct link to Parameters")

### module[​](#module "Direct link to module")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

### stage[​](#stage "Direct link to stage")

[`ShaderModuleUniformLayoutStage`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutStage.md)

## Returns[​](#returns "Direct link to Returns")

`string`\[] | `null`

`null` when the stage has no source or the expected block is absent.
