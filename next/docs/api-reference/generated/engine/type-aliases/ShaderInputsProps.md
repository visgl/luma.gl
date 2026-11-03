# Type Alias: ShaderInputsProps\<ShaderPropsT>

> **ShaderInputsProps**<`ShaderPropsT`> = `Partial`<`{ [P in keyof ShaderPropsT]?: Partial<ShaderPropsT[P]> }`> & `object`

Defined in: [modules/engine/src/shader-inputs.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L23)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindings?[​](#bindings "Direct link to bindings?")

> `optional` **bindings?**: `Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)>

Shader resource bindings that are not owned by a shader module.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### ShaderPropsT[​](#shaderpropst "Direct link to ShaderPropsT")

`ShaderPropsT` *extends* `Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>
