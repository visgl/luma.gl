# Type Alias: ShaderInjection

> **ShaderInjection** = `object`

Defined in: [lib/shader-assembly/shader-injections.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injections.ts#L21)

Language-specific source inserted at a named shader target.

## Properties[​](#properties "Direct link to Properties")

### glsl?[​](#glsl "Direct link to glsl?")

> `optional` **glsl?**: `string`

Defined in: [lib/shader-assembly/shader-injections.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injections.ts#L27)

GLSL source. Omit to skip this injection for GLSL assembly.

***

### order?[​](#order "Direct link to order?")

> `optional` **order?**: `number`

Defined in: [lib/shader-assembly/shader-injections.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injections.ts#L31)

Relative order at the target; defaults to zero.

***

### stage[​](#stage "Direct link to stage")

> **stage**: `"vertex"` | `"fragment"`

Defined in: [lib/shader-assembly/shader-injections.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injections.ts#L23)

Shader stage receiving the injection.

***

### target[​](#target "Direct link to target")

> **target**: `string`

Defined in: [lib/shader-assembly/shader-injections.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injections.ts#L25)

Unqualified hook name or built-in target such as #main-start.

***

### wgsl?[​](#wgsl "Direct link to wgsl?")

> `optional` **wgsl?**: `string`

Defined in: [lib/shader-assembly/shader-injections.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injections.ts#L29)

WGSL source. Omit to skip this injection for WGSL assembly.
