# Type Alias: ShaderPluginInterStageVariable

> **ShaderPluginInterStageVariable** = `object`

Defined in: [lib/shader-plugin.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L18)

Cross-stage value contributed by a ShaderPlugin.

## Properties[​](#properties "Direct link to Properties")

### interpolation?[​](#interpolation "Direct link to interpolation?")

> `optional` **interpolation?**: [`ShaderPluginInterStageVariableInterpolation`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderPluginInterStageVariableInterpolation.md)

Defined in: [lib/shader-plugin.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L22)

Defaults to smooth for floating-point types and flat for integer types.

***

### type[​](#type "Direct link to type")

> **type**: `AttributeShaderType`

Defined in: [lib/shader-plugin.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L20)

Portable scalar or vector shader type.
