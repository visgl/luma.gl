# Type Alias: EffectRendererProps\<Options>

> **EffectRendererProps**<`Options`> = `Omit`<[`ShaderPassRendererProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererProps.md), `"shaderPasses"`> & `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:256](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L256)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### effects[​](#effects "Direct link to effects")

> **effects**: `EffectEntries`<`Options`>

Effects run in array order, with each color output feeding the next effect. Configure reusable effects inline by supplying their definition and options. Each configuration is checked against the options declared by its effect.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Options[​](#options "Direct link to Options")

`Options` *extends* readonly `unknown`\[] = readonly `unknown`\[]
