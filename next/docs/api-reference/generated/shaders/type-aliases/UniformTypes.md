# Type Alias: UniformTypes\<PropsT>

> **UniformTypes**<`PropsT`> = `{ [name in keyof PropsT]-?: UniformType<NonNullable<PropsT[name]>> & CompositeShaderType }`

Defined in: [lib/utils/uniform-types.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/utils/uniform-types.ts#L87)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### PropsT[​](#propst "Direct link to PropsT")

`PropsT` *extends* `UniformProps`
