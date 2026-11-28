# Type Alias: CompositeShaderPass\<TargetNameT>

> **CompositeShaderPass**<`TargetNameT`> = `object`

Defined in: [lib/shader-module/composite-shader-pass.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L44)

Composition format accepted by ShaderPassRenderer. Use EffectDefinition from @luma.gl/engine to author new fullscreen effect chains.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetNameT[​](#targetnamet "Direct link to TargetNameT")

`TargetNameT` *extends* `string` = `string`

## Properties[​](#properties "Direct link to Properties")

### compute?[​](#compute "Direct link to compute?")

> `optional` **compute?**: [`CompositeShaderPassComputeOptimization`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPassComputeOptimization.md)<`TargetNameT`>

Defined in: [lib/shader-module/composite-shader-pass.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L54)

Optional fused WebGPU dispatch; existing fragment steps remain the portable fallback.

***

### initialPasses?[​](#initialpasses "Direct link to initialPasses?")

> `optional` **initialPasses?**: `object`

Defined in: [lib/shader-module/composite-shader-pass.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L48)

Selects an implementation for the initial stage before running shared steps.

#### compute?[​](#compute-1 "Direct link to compute?")

> `optional` **compute?**: `Omit`<[`CompositeShaderPassComputeOptimization`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPassComputeOptimization.md)<`TargetNameT`>, `"replacedPasses"`>

#### fragment[​](#fragment "Direct link to fragment")

> **fragment**: [`CompositeShaderPassStep`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPassStep.md)<`TargetNameT`>\[]

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-module/composite-shader-pass.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L45)

***

### renderTargets?[​](#rendertargets "Direct link to renderTargets?")

> `optional` **renderTargets?**: `Record`<`TargetNameT`, [`ShaderPassRenderTarget`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPassRenderTarget.md)>

Defined in: [lib/shader-module/composite-shader-pass.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L46)

***

### steps[​](#steps "Direct link to steps")

> **steps**: [`CompositeShaderPassStep`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPassStep.md)<`TargetNameT`>\[]

Defined in: [lib/shader-module/composite-shader-pass.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L52)
