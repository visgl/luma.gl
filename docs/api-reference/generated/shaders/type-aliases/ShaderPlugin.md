# Type Alias: ShaderPlugin

> **ShaderPlugin** = `object`

Defined in: [lib/shader-plugin.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L32)

Reusable shader assembly descriptor with one portable interface and language-specific source.

## Properties[​](#properties "Direct link to Properties")

### defines?[​](#defines "Direct link to defines?")

> `optional` **defines?**: `Record`<`string`, `boolean` | `number`>

Defined in: [lib/shader-plugin.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L38)

Boolean or numeric preprocessor defines added to shader assembly.

***

### injections?[​](#injections "Direct link to injections?")

> `optional` **injections?**: [`ShaderInjection`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderInjection.md)\[] | `Record`<`string`, `string`>

Defined in: [lib/shader-plugin.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L40)

Named injections as explicit-stage objects or optionally language-qualified string keys.

***

### injectionTargets?[​](#injectiontargets "Direct link to injectionTargets?")

> `optional` **injectionTargets?**: [`ShaderInjectionTarget`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderInjectionTarget.md)\[]

Defined in: [lib/shader-plugin.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L42)

Callable extension points with a shared name and language-specific source.

***

### interStageVariables?[​](#interstagevariables "Direct link to interStageVariables?")

> `optional` **interStageVariables?**: `Record`<`string`, [`ShaderPluginInterStageVariable`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderPluginInterStageVariable.md)>

Defined in: [lib/shader-plugin.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L46)

Values transported from the selected vertex entry point to the fragment entry point.

***

### module?[​](#module "Direct link to module?")

> `optional` **module?**: [`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)<`any`, `any`, `any`>

Defined in: [lib/shader-plugin.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L36)

Primary shader module. Supporting modules belong in its dependencies; omit for injection-only plugins.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-plugin.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L34)

Stable plugin identifier.

***

### vertexInputs?[​](#vertexinputs "Direct link to vertexInputs?")

> `optional` **vertexInputs?**: `Record`<`string`, `AttributeShaderType`>

Defined in: [lib/shader-plugin.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L44)

Shader-facing vertex inputs added by this plugin. Buffer ownership remains with the caller.
