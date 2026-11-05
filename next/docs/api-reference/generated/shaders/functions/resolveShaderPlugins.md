# Function: resolveShaderPlugins()

> **resolveShaderPlugins**(`plugins?`, `shaderLanguage`): [`ResolvedShaderPlugins`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderPlugins.md)

Defined in: [lib/shader-plugin.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L66)

Resolve plugin interfaces and select injection source for one shader language.

## Parameters[​](#parameters "Direct link to Parameters")

### plugins?[​](#plugins "Direct link to plugins?")

readonly [`ShaderPlugin`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPlugin.md)\[] = `[]`

### shaderLanguage[​](#shaderlanguage "Direct link to shaderLanguage")

`"glsl"` | `"wgsl"`

## Returns[​](#returns "Direct link to Returns")

[`ResolvedShaderPlugins`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderPlugins.md)
