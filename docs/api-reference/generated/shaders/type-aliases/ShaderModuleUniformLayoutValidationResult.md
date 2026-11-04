# Type Alias: ShaderModuleUniformLayoutValidationResult

> **ShaderModuleUniformLayoutValidationResult** = `object`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L17)

Describes the result of comparing declared `uniformTypes` with the fields found in a shader uniform block.

## Properties[​](#properties "Direct link to Properties")

### actualUniformNames[​](#actualuniformnames "Direct link to actualUniformNames")

> **actualUniformNames**: `string`\[]

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L27)

Field names parsed from the shader source.

***

### expectedUniformNames[​](#expecteduniformnames "Direct link to expectedUniformNames")

> **expectedUniformNames**: `string`\[]

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L25)

Field names declared by the module metadata.

***

### matches[​](#matches "Direct link to matches")

> **matches**: `boolean`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L29)

Whether the declared and parsed field lists match exactly.

***

### moduleName[​](#modulename "Direct link to moduleName")

> **moduleName**: `string`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L19)

Name of the shader module being validated.

***

### stage[​](#stage "Direct link to stage")

> **stage**: [`ShaderModuleUniformLayoutStage`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformLayoutStage.md)

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L23)

Shader stage that was inspected.

***

### uniformBlockName[​](#uniformblockname "Direct link to uniformBlockName")

> **uniformBlockName**: `string`

Defined in: [lib/shader-module/shader-module-uniform-layout.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module-uniform-layout.ts#L21)

Expected block name derived from the shader module name.
