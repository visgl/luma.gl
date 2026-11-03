# Type Alias: ShaderPlugin

> **ShaderPlugin** = `object`

Defined in: [lib/shader-plugin.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L65)

Reusable shader assembly descriptor with one portable interface and language-specific source.

## Properties[​](#properties "Direct link to Properties")

### defines?[​](#defines "Direct link to defines?")

> `optional` **defines?**: `Record`<`string`, `boolean` | `number`>

Defined in: [lib/shader-plugin.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L71)

Boolean or numeric preprocessor defines added to shader assembly.

***

### hooks?[​](#hooks "Direct link to hooks?")

> `optional` **hooks?**: ([`ShaderPluginHook`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPluginHook.md) | `string`)\[]

Defined in: [lib/shader-plugin.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L75)

Callable extension points as explicit-stage objects or optionally language-qualified signatures.

***

### injections?[​](#injections "Direct link to injections?")

> `optional` **injections?**: [`ShaderPluginInjection`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPluginInjection.md)\[] | `Record`<`string`, `string`>

Defined in: [lib/shader-plugin.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L73)

Named injections as explicit-stage objects or optionally language-qualified string keys.

***

### interStageVariables?[​](#interstagevariables "Direct link to interStageVariables?")

> `optional` **interStageVariables?**: `Record`<`string`, [`ShaderPluginInterStageVariable`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPluginInterStageVariable.md)>

Defined in: [lib/shader-plugin.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L79)

Values transported from the selected vertex entry point to the fragment entry point.

***

### module?[​](#module "Direct link to module?")

> `optional` **module?**: [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)<`any`, `any`, `any`>

Defined in: [lib/shader-plugin.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L69)

Primary shader module. Supporting modules belong in its dependencies; omit for injection-only plugins.

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-plugin.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L67)

Stable plugin identifier.

***

### vertexInputs?[​](#vertexinputs "Direct link to vertexInputs?")

> `optional` **vertexInputs?**: `Record`<`string`, `AttributeShaderType`>

Defined in: [lib/shader-plugin.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L77)

Shader-facing vertex inputs added by this plugin. Buffer ownership remains with the caller.
