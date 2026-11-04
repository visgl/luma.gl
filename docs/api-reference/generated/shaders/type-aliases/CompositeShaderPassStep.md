# Type Alias: CompositeShaderPassStep\<TargetNameT>

> **CompositeShaderPassStep**<`TargetNameT`> = `object`

Defined in: [lib/shader-module/composite-shader-pass.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L9)

One ordered step in a [CompositeShaderPass](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPass.md).

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetNameT[​](#targetnamet "Direct link to TargetNameT")

`TargetNameT` *extends* `string` = `string`

## Properties[​](#properties "Direct link to Properties")

### inputs?[​](#inputs "Direct link to inputs?")

> `optional` **inputs?**: `Record`<`string`, [`ShaderPassInputSource`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderPassInputSource.md)<`TargetNameT`>>

Defined in: [lib/shader-module/composite-shader-pass.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L11)

***

### output?[​](#output "Direct link to output?")

> `optional` **output?**: `"previous"` | `TargetNameT`

Defined in: [lib/shader-module/composite-shader-pass.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L12)

***

### shaderPass[​](#shaderpass "Direct link to shaderPass")

> **shaderPass**: [`ShaderPass`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderPass.md)<`any`, `any`, `any`, `any`>

Defined in: [lib/shader-module/composite-shader-pass.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L10)

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `Record`<`string`, `UniformValue`>

Defined in: [lib/shader-module/composite-shader-pass.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L13)
