# Function: getShaderModuleUniforms()

> **getShaderModuleUniforms**<`ShaderModuleT`>(`module`, `props?`, `oldUniforms?`): `Record`<`string`, `Binding` | [`ShaderModuleUniformValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformValue.md)>

Defined in: [lib/shader-module/shader-module.ts:169](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-module.ts#L169)

Convert module props to uniforms

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### ShaderModuleT[​](#shadermodulet "Direct link to ShaderModuleT")

`ShaderModuleT` *extends* [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)<`Record`<`string`, `unknown`>, `Record`<`string`, [`ShaderModuleUniformValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformValue.md)>, `PickBindings`<`Record`<`string`, `unknown`>>>

## Parameters[​](#parameters "Direct link to Parameters")

### module[​](#module "Direct link to module")

`ShaderModuleT`

### props?[​](#props "Direct link to props?")

`ShaderModuleT`\[`"props"`]

### oldUniforms?[​](#olduniforms "Direct link to oldUniforms?")

`ShaderModuleT`\[`"uniforms"`]

## Returns[​](#returns "Direct link to Returns")

`Record`<`string`, `Binding` | [`ShaderModuleUniformValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModuleUniformValue.md)>
