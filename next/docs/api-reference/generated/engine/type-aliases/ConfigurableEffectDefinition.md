# Type Alias: ConfigurableEffectDefinition\<Options, TargetName>

> **ConfigurableEffectDefinition**<`Options`, `TargetName`> = { `name`: `string`; `configure`: [`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`>; } | [`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`> & `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L83)

A reusable effect whose resource descriptors or pass sequence depend on options. Configure it when constructing the stack or when topology changes. Per-frame uniforms and external textures are supplied to the renderer separately.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Options[​](#options "Direct link to Options")

`Options`

### TargetName[​](#targetname "Direct link to TargetName")

`TargetName` *extends* `string` = `string`

## Union Members[​](#union-members "Direct link to Union Members")

### Type Literal[​](#type-literal "Direct link to Type Literal")

{ `name`: `string`; `configure`: [`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`>; }

#### name[​](#name "Direct link to name")

> **name**: `string`

Name of the effect being configured.

#### configure()[​](#configure "Direct link to configure()")

> **configure**(`options?`): [`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`>

Returns resources and passes for one configuration.

##### Parameters[​](#parameters "Direct link to Parameters")

###### options?[​](#options-1 "Direct link to options?")

`Options`

##### Returns[​](#returns "Direct link to Returns")

[`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`>

***

[`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)<`TargetName`> & `object`
