# Type Alias: EffectDefinition\<TargetName>

> **EffectDefinition**<`TargetName`> = `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L38)

A reusable, device-independent description of a fullscreen effect.

An effect receives the preceding color image and can sample additional textures supplied for the frame. Passes write either private named targets or the shared color chain. Each use of a definition gets its own render targets and history.

Use `EffectDefinition<'targetA' | 'targetB'>` to check local target references when declaring an effect as a module-level constant. Treat the definition as immutable once a renderer uses it.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetName[​](#targetname "Direct link to TargetName")

`TargetName` *extends* `string` = `string`

Names of textures owned by this effect.

## Properties[​](#properties "Direct link to Properties")

### initialPasses?[​](#initialpasses "Direct link to initialPasses?")

> `optional` **initialPasses?**: `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L55)

Optional backend alternatives for a stage before the shared passes. Both implementations must produce the named textures the shared passes consume. The renderer selects the implementation once when constructed.

#### compute?[​](#compute "Direct link to compute?")

> `optional` **compute?**: `NonNullable`<`CompositeShaderPass`<`TargetName`>\[`"initialPasses"`]>\[`"compute"`]

A fused WebGPU dispatch. Declare each storage output by binding name, and mark the corresponding resource with `storage: true`. The first listed output determines dispatch dimensions. The renderer checks device limits and storage-format support and chooses the fragment sequence if needed.

#### fragment[​](#fragment "Direct link to fragment")

> **fragment**: [`EffectPass`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectPass.md)<`TargetName`>\[]

Portable fullscreen draws in execution order.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/engine/src/passes/effect-renderer.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L40)

Label used to identify the effect and its GPU resources in diagnostics.

***

### passes[​](#passes "Direct link to passes")

> **passes**: [`EffectPass`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectPass.md)<`TargetName`>\[]

Defined in: [modules/engine/src/passes/effect-renderer.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L73)

Shared fullscreen draws in execution order. Use `previous` to read or update the color chain, `original` to read the stack's input image, and a local resource name to route a texture between draws within the effect.

***

### resources?[​](#resources "Direct link to resources?")

> `optional` **resources?**: `NonNullable`<`CompositeShaderPass`<`TargetName`>\[`"renderTargets"`]>

Defined in: [modules/engine/src/passes/effect-renderer.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L48)

Textures owned by each occurrence of this effect. A target's scale is relative to the renderer size. History targets retain their prior frame value and may declare how to initialize it. Use an empty object for an effect that only writes to the shared color chain.
