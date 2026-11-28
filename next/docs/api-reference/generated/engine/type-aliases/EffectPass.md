# Type Alias: EffectPass\<TargetName>

> **EffectPass**<`TargetName`> = `CompositeShaderPass`<`TargetName`>\[`"steps"`]\[`number`] & `object` | `Omit`<`CompositeShaderPass`<`TargetName`>\[`"steps"`]\[`number`], `"shaderPass"`> & `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L18)

A fullscreen draw in an effect. The shader supplies the filtering or sampling implementation. Inputs route textures to its bindings and output selects the destination. Uniform values here provide defaults for this draw.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetName[​](#targetname "Direct link to TargetName")

`TargetName` *extends* `string` = `string`
