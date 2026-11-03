# Type Alias: CompositeShaderPass\<TargetNameT>

> **CompositeShaderPass**<`TargetNameT`> = `object`

Defined in: [lib/shader-module/composite-shader-pass.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L41)

Declarative composition of shader passes with owned targets and optional compute execution.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetNameT[​](#targetnamet "Direct link to TargetNameT")

`TargetNameT` *extends* `string` = `string`

## Properties[​](#properties "Direct link to Properties")

### compute?[​](#compute "Direct link to compute?")

> `optional` **compute?**: [`CompositeShaderPassComputeOptimization`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPassComputeOptimization.md)<`TargetNameT`>

Defined in: [lib/shader-module/composite-shader-pass.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L46)

Optional fused WebGPU dispatch; existing fragment steps remain the portable fallback.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-module/composite-shader-pass.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L42)

***

### renderTargets?[​](#rendertargets "Direct link to renderTargets?")

> `optional` **renderTargets?**: `Record`<`TargetNameT`, [`ShaderPassRenderTarget`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPassRenderTarget.md)>

Defined in: [lib/shader-module/composite-shader-pass.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L43)

***

### steps[​](#steps "Direct link to steps")

> **steps**: [`CompositeShaderPassStep`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/CompositeShaderPassStep.md)<`TargetNameT`>\[]

Defined in: [lib/shader-module/composite-shader-pass.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L44)
