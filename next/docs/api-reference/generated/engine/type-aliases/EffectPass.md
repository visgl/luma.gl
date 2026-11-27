# Type Alias: EffectPass\<TargetName>

> **EffectPass**<`TargetName`> = `CompositeShaderPass`<`TargetName`>\[`"steps"`]\[`number`] & `object`

Defined in: [modules/engine/src/passes/effect-renderer.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L14)

A fullscreen draw in an effect. The shader supplies the filtering or sampling implementation. Inputs route textures to its bindings and output selects the destination. Uniform values here provide defaults for this draw.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### kind[​](#kind "Direct link to kind")

> **kind**: `"fullscreen"`

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TargetName[​](#targetname "Direct link to TargetName")

`TargetName` *extends* `string` = `string`
