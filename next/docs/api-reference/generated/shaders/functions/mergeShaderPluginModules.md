# Function: mergeShaderPluginModules()

> **mergeShaderPluginModules**(`modules?`, `pluginModules?`, `options?`): [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

Defined in: [lib/shader-plugin.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L134)

Preserve explicit module inputs while appending plugin modules by first-seen name. Optional diagnostics report distinct descriptors sharing a name, without changing selection. Descriptor identity is checked; equivalent independently-created descriptors also report a conflict.

## Parameters[​](#parameters "Direct link to Parameters")

### modules?[​](#modules "Direct link to modules?")

readonly [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[] = `[]`

### pluginModules?[​](#pluginmodules "Direct link to pluginModules?")

readonly [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[] = `[]`

### options?[​](#options "Direct link to options?")

#### onConflict?[​](#onconflict "Direct link to onConflict?")

(`name`, `selected`, `ignored`) => `void`

## Returns[​](#returns "Direct link to Returns")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]
