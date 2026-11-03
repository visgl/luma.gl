# Type Alias: ShaderPluginInterStageVariable

> **ShaderPluginInterStageVariable** = `object`

Defined in: [lib/shader-plugin.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L51)

Cross-stage value contributed by a ShaderPlugin.

## Properties[​](#properties "Direct link to Properties")

### interpolation?[​](#interpolation "Direct link to interpolation?")

> `optional` **interpolation?**: [`ShaderPluginInterStageVariableInterpolation`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPluginInterStageVariableInterpolation.md)

Defined in: [lib/shader-plugin.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L55)

Defaults to smooth for floating-point types and flat for integer types.

***

### type[​](#type "Direct link to type")

> **type**: `AttributeShaderType`

Defined in: [lib/shader-plugin.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L53)

Portable scalar or vector shader type.
