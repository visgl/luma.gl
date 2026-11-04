# Type Alias: ShaderPass\<PropsT, UniformsT, BindingsT, RenderTargetNameT>

> **ShaderPass**<`PropsT`, `UniformsT`, `BindingsT`, `RenderTargetNameT`> = [`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)<`PropsT`, `UniformsT`, `BindingsT`> & `object`

Defined in: [lib/shader-module/shader-pass.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L36)

A ShaderPass is a ShaderModule that can be run "standalone" (e.g. post processing effects) It adds additional information on how to run the module. A ShaderPass can require one or more sub passes.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### passes?[​](#passes "Direct link to passes?")

> `optional` **passes?**: [`ShaderSubPass`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderSubPass.md)<`UniformsT`, `Extract`\<keyof `BindingsT`, `string`>, `RenderTargetNameT`>\[]

A shader pass can run multiple sub passes

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### PropsT[​](#propst "Direct link to PropsT")

`PropsT` *extends* `Record`<`string`, `any`> = `Record`<`string`, `any`>

### UniformsT[​](#uniformst "Direct link to UniformsT")

`UniformsT` *extends* `Record`<`string`, `UniformValue`> = `PickUniforms`<`PropsT`>

### BindingsT[​](#bindingst "Direct link to BindingsT")

`BindingsT` *extends* `Record`<`string`, `Binding`> = `PickBindings`<`PropsT`>

### RenderTargetNameT[​](#rendertargetnamet "Direct link to RenderTargetNameT")

`RenderTargetNameT` *extends* `string` = `never`
