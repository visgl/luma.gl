# Type Alias: CompositeShaderPassComputeOptimization\<TargetNameT>

> **CompositeShaderPassComputeOptimization**<`TargetNameT`> = `object`

Defined in: [lib/shader-module/composite-shader-pass.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L17)

Optional WebGPU compute stage that replaces equivalent fragment-only fallback passes.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetNameT[​](#targetnamet "Direct link to TargetNameT")

`TargetNameT` *extends* `string` = `string`

## Properties[​](#properties "Direct link to Properties")

### input[​](#input "Direct link to input")

> **input**: [`ShaderPassInputSource`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderPassInputSource.md)<`TargetNameT`>

Defined in: [lib/shader-module/composite-shader-pass.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L31)

Logical source image consumed by the fused compute dispatch.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-module/composite-shader-pass.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L19)

Stable identifier used for compute resources and command labels.

***

### outputs[​](#outputs "Direct link to outputs")

> **outputs**: `Record`<`string`, `TargetNameT`>

Defined in: [lib/shader-module/composite-shader-pass.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L33)

Mapping from compute storage-texture names to owned render targets.

***

### replacedPasses[​](#replacedpasses "Direct link to replacedPasses")

> **replacedPasses**: readonly `string`\[]

Defined in: [lib/shader-module/composite-shader-pass.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L35)

Fragment pass names removed when the WebGPU optimization is supported.

***

### source[​](#source "Direct link to source")

> **source**: `string`

Defined in: [lib/shader-module/composite-shader-pass.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L21)

Complete WGSL compute entry point with explicit binding locations.

***

### uniformBinding[​](#uniformbinding "Direct link to uniformBinding")

> **uniformBinding**: `string`

Defined in: [lib/shader-module/composite-shader-pass.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L25)

Explicit WGSL uniform-buffer binding name used by the compute entry point.

***

### uniformModule[​](#uniformmodule "Direct link to uniformModule")

> **uniformModule**: `string`

Defined in: [lib/shader-module/composite-shader-pass.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L23)

Existing fragment module that owns the scalar runtime uniforms.

***

### uniformNames[​](#uniformnames "Direct link to uniformNames")

> **uniformNames**: readonly `string`\[]

Defined in: [lib/shader-module/composite-shader-pass.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L27)

Scalar uniform packing order used by the compute shader.

***

### uniforms[​](#uniforms "Direct link to uniforms")

> **uniforms**: `Record`<`string`, `number`>

Defined in: [lib/shader-module/composite-shader-pass.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L29)

Composite-pass scalar defaults layered below per-frame runtime overrides.

***

### workgroupSize[​](#workgroupsize "Direct link to workgroupSize")

> **workgroupSize**: readonly \[`number`, `number`]

Defined in: [lib/shader-module/composite-shader-pass.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-module/composite-shader-pass.ts#L37)

Compute workgroup width and height in highest-resolution output texels.
