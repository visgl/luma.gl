# Type Alias: ShaderHook

> **ShaderHook** = `object`

Defined in: [lib/shader-assembly/shader-hooks.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-hooks.ts#L18)

The shader hook mechanism allows the application to create shaders that can be automatically extended by the shader modules the application includes.

A shader hook function that shader modules can inject code into. Shaders can call these functions, which will be no-ops by default.

If a shader module injects code it will be executed upon the hook function call.

## Properties[​](#properties "Direct link to Properties")

### footer?[​](#footer "Direct link to footer?")

> `optional` **footer?**: `string`

Defined in: [lib/shader-assembly/shader-hooks.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-hooks.ts#L25)

Code always included at the end of a hook function

***

### header?[​](#header "Direct link to header?")

> `optional` **header?**: `string`

Defined in: [lib/shader-assembly/shader-hooks.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-hooks.ts#L23)

Code always included at the beginning of a hook function

***

### hook[​](#hook "Direct link to hook")

> **hook**: `string`

Defined in: [lib/shader-assembly/shader-hooks.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-hooks.ts#L21)

`vs:` or `fs:` followed by the name and arguments of the function, e.g. `vs:MYHOOK_func(inout vec4 value)`. Hook name without arguments will also be used as the name of the shader hook

***

### signature?[​](#signature "Direct link to signature?")

> `optional` **signature?**: `string`

Defined in: [lib/shader-assembly/shader-hooks.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-hooks.ts#L27)

To Be Documented
