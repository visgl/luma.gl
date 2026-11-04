# Type Alias: ResolvedShaderPlugins

> **ResolvedShaderPlugins** = `object`

Defined in: [lib/shader-plugin.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L50)

ShaderPlugin contributions resolved for one shader language.

## Properties[​](#properties "Direct link to Properties")

### defines[​](#defines "Direct link to defines")

> **defines**: `Record`<`string`, `boolean` | `number`>

Defined in: [lib/shader-plugin.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L56)

Resolved boolean or numeric preprocessor defines.

***

### injections[​](#injections "Direct link to injections")

> **injections**: `Record`<`string`, [`ResolvedShaderInjection`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderInjection.md)\[]>

Defined in: [lib/shader-plugin.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L58)

Resolved named code injections grouped by target.

***

### injectionTargets[​](#injectiontargets "Direct link to injectionTargets")

> **injectionTargets**: [`ShaderInjectionTarget`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderInjectionTarget.md)\[]

Defined in: [lib/shader-plugin.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L54)

Language-selected callable injection target declarations.

***

### interStageVariables[​](#interstagevariables "Direct link to interStageVariables")

> **interStageVariables**: `Record`<`string`, [`ResolvedShaderPluginInterStageVariable`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ResolvedShaderPluginInterStageVariable.md)>

Defined in: [lib/shader-plugin.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L62)

Resolved inter-stage variables in plugin declaration order.

***

### modules[​](#modules "Direct link to modules")

> **modules**: [`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

Defined in: [lib/shader-plugin.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L52)

Resolved shader modules in plugin declaration order.

***

### vertexInputs[​](#vertexinputs "Direct link to vertexInputs")

> **vertexInputs**: `Record`<`string`, `AttributeShaderType`>

Defined in: [lib/shader-plugin.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L60)

Resolved shader-facing vertex inputs in plugin declaration order.
