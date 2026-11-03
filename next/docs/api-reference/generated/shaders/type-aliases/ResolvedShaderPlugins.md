# Type Alias: ResolvedShaderPlugins

> **ResolvedShaderPlugins** = `object`

Defined in: [lib/shader-plugin.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L83)

ShaderPlugin contributions resolved for one shader language.

## Properties[​](#properties "Direct link to Properties")

### defines[​](#defines "Direct link to defines")

> **defines**: `Record`<`string`, `boolean` | `number`>

Defined in: [lib/shader-plugin.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L89)

Resolved boolean or numeric preprocessor defines.

***

### hooks[​](#hooks "Direct link to hooks")

> **hooks**: [`ShaderHook`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderHook.md)\[]

Defined in: [lib/shader-plugin.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L87)

Language-selected hook declarations.

***

### injections[​](#injections "Direct link to injections")

> **injections**: `Record`<`string`, [`ShaderInjection`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderInjection.md)\[]>

Defined in: [lib/shader-plugin.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L91)

Resolved named code injections grouped by target.

***

### interStageVariables[​](#interstagevariables "Direct link to interStageVariables")

> **interStageVariables**: `Record`<`string`, [`ResolvedShaderPluginInterStageVariable`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderPluginInterStageVariable.md)>

Defined in: [lib/shader-plugin.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L95)

Resolved inter-stage variables in plugin declaration order.

***

### modules[​](#modules "Direct link to modules")

> **modules**: [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

Defined in: [lib/shader-plugin.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L85)

Resolved shader modules in plugin declaration order.

***

### vertexInputs[​](#vertexinputs "Direct link to vertexInputs")

> **vertexInputs**: `Record`<`string`, `AttributeShaderType`>

Defined in: [lib/shader-plugin.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L93)

Resolved shader-facing vertex inputs in plugin declaration order.
