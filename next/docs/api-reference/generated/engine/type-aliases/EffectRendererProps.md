# Type Alias: EffectRendererProps

> **EffectRendererProps** = `Omit`<[`ShaderPassRendererProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererProps.md), `"shaderPasses"`> & `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L80)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### effects[​](#effects "Direct link to effects")

> **effects**: readonly [`EffectDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectDefinition.md)\[]

Effects run in array order, with each color output feeding the next effect.
