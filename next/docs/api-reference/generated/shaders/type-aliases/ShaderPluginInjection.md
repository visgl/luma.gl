# Type Alias: ShaderPluginInjection

> **ShaderPluginInjection** = [`ShaderPluginTarget`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderPluginTarget.md) & `object`

Defined in: [lib/shader-plugin.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-plugin.ts#L38)

Named shader source injection contributed by a ShaderPlugin.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### glsl?[​](#glsl "Direct link to glsl?")

> `optional` **glsl?**: `string`

GLSL source for this target. Omit to skip this injection when assembling GLSL.

### order?[​](#order "Direct link to order?")

> `optional` **order?**: `number`

Relative injection order within the target.

### wgsl?[​](#wgsl "Direct link to wgsl?")

> `optional` **wgsl?**: `string`

WGSL source for this target. Omit to skip this injection when assembling WGSL.
