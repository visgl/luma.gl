# Function: validateShaderModuleUniformLayout()

> **validateShaderModuleUniformLayout**(`module`, `stage`, `options?`): [`ShaderModuleUniformLayoutValidationResult`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutValidationResult.md) | `null`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L138)

Validates that a shader module's parsed uniform block matches `uniformTypes`.

When a mismatch is detected, the helper logs a formatted error and optionally throws via assert.

## Parameters[​](#parameters "Direct link to Parameters")

### module[​](#module "Direct link to module")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

### stage[​](#stage "Direct link to stage")

[`ShaderModuleUniformLayoutStage`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutStage.md)

### options?[​](#options "Direct link to options?")

#### log?[​](#log "Direct link to log?")

`Logger`

#### throwOnError?[​](#throwonerror "Direct link to throwOnError?")

`boolean`

## Returns[​](#returns "Direct link to Returns")

[`ShaderModuleUniformLayoutValidationResult`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutValidationResult.md) | `null`
