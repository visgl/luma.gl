# Type Alias: ShaderSubPass\<UniformsT, BindingNameT, RenderTargetNameT>

> **ShaderSubPass**<`UniformsT`, `BindingNameT`, `RenderTargetNameT`> = `object`

Defined in: [lib/shader-module/shader-pass.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L49)

Information on how to run a specific sub pass

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### UniformsT[​](#uniformst "Direct link to UniformsT")

`UniformsT` *extends* `Record`<`string`, `UniformValue`> = `Record`<`string`, `UniformValue`>

### BindingNameT[​](#bindingnamet "Direct link to BindingNameT")

`BindingNameT` *extends* `string` = `string`

### RenderTargetNameT[​](#rendertargetnamet "Direct link to RenderTargetNameT")

`RenderTargetNameT` *extends* `string` = `string`

## Properties[​](#properties "Direct link to Properties")

### action?[​](#action "Direct link to action?")

> `optional` **action?**: `"filter"` | `"sample"`

Defined in: [lib/shader-module/shader-pass.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L59)

Action indicates whether this pass:

* filters the color in each pixel (provides a `<pass.name>_filterColor()` shader function)
* performs its own sampling (provides a `<pass.name>_sampleColor()` shader function)

***

### filter?[​](#filter "Direct link to filter?")

> `optional` **filter?**: `boolean`

Defined in: [lib/shader-module/shader-pass.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L61)

***

### inputs?[​](#inputs "Direct link to inputs?")

> `optional` **inputs?**: `Partial`<`Record`<`BindingNameT` | `"sourceTexture"`, [`ShaderPassInputSource`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderPassInputSource.md)<`RenderTargetNameT`>>>

Defined in: [lib/shader-module/shader-pass.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L64)

Mapping from shader binding name to the logical texture source.

***

### output?[​](#output "Direct link to output?")

> `optional` **output?**: `"previous"` | `RenderTargetNameT`

Defined in: [lib/shader-module/shader-pass.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L68)

Output target for this sub pass. Defaults to the shared "previous" chain.

***

### sampler?[​](#sampler "Direct link to sampler?")

> `optional` **sampler?**: `boolean`

Defined in: [lib/shader-module/shader-pass.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L60)

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `UniformsT`

Defined in: [lib/shader-module/shader-pass.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/shader-pass.ts#L62)
