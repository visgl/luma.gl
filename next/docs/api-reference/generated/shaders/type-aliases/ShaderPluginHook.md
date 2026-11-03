# Type Alias: ShaderPluginHook

> **ShaderPluginHook** = [`ShaderPluginTarget`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPluginTarget.md) & `object`

Defined in: [lib/shader-plugin.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L30)

Hook function declared by a plugin, with parameter signatures per language.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### glsl?[​](#glsl "Direct link to glsl?")

> `optional` **glsl?**: `string`

GLSL parameter list, including parentheses.

### wgsl?[​](#wgsl "Direct link to wgsl?")

> `optional` **wgsl?**: `string`

WGSL parameter list, including parentheses.
