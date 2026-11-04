# Function: getShaderModuleUniformLayoutValidationResult()

> **getShaderModuleUniformLayoutValidationResult**(`module`, `stage`): [`ShaderModuleUniformLayoutValidationResult`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutValidationResult.md) | `null`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L108)

Computes the validation result for a shader module's declared and parsed uniform-block field lists.

## Parameters[​](#parameters "Direct link to Parameters")

### module[​](#module "Direct link to module")

[`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

### stage[​](#stage "Direct link to stage")

[`ShaderModuleUniformLayoutStage`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutStage.md)

## Returns[​](#returns "Direct link to Returns")

[`ShaderModuleUniformLayoutValidationResult`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutValidationResult.md) | `null`

`null` when the module has no declared uniform types or no matching block.
