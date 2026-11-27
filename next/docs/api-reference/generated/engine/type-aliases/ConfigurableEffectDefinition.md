# Type Alias: ConfigurableEffectDefinition\<Options, TargetName>

> **ConfigurableEffectDefinition**<`Options`, `TargetName`> = `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L73)

A reusable effect whose resource descriptors or pass sequence depend on options. Configure it when constructing the stack or when topology changes. Per-frame uniforms and external textures are supplied to the renderer separately.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Options[​](#options "Direct link to Options")

`Options`

### TargetName[​](#targetname "Direct link to TargetName")

`TargetName` *extends* `string` = `string`

## Properties[​](#properties "Direct link to Properties")

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/engine/src/passes/effect-renderer.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L75)

Name of the effect being configured.

## Methods[​](#methods "Direct link to Methods")

### configure()[​](#configure "Direct link to configure()")

> **configure**(`options?`): [`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`>

Defined in: [modules/engine/src/passes/effect-renderer.ts:78](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L78)

Returns resources and passes for one configuration.

#### Parameters[​](#parameters "Direct link to Parameters")

##### options?[​](#options-1 "Direct link to options?")

`Options`

#### Returns[​](#returns "Direct link to Returns")

[`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`>
