# Type Alias: ShaderInjectionTarget

> **ShaderInjectionTarget** = `object`

Defined in: [lib/shader-assembly/shader-injection-targets.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injection-targets.ts#L8)

A named callable target for shader source injections.

## Properties[​](#properties "Direct link to Properties")

### glsl?[​](#glsl "Direct link to glsl?")

> `optional` **glsl?**: `object`

Defined in: [lib/shader-assembly/shader-injection-targets.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injection-targets.ts#L14)

GLSL signature and source surrounding injected statements.

#### footer?[​](#footer "Direct link to footer?")

> `optional` **footer?**: `string`

#### header?[​](#header "Direct link to header?")

> `optional` **header?**: `string`

#### parameters[​](#parameters "Direct link to parameters")

> **parameters**: `string`

#### returnType?[​](#returntype "Direct link to returnType?")

> `optional` **returnType?**: `string`

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [lib/shader-assembly/shader-injection-targets.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injection-targets.ts#L10)

Function name shared by both shader languages.

***

### stage[​](#stage "Direct link to stage")

> **stage**: `"vertex"` | `"fragment"`

Defined in: [lib/shader-assembly/shader-injection-targets.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injection-targets.ts#L12)

Shader stage that calls the target.

***

### wgsl?[​](#wgsl "Direct link to wgsl?")

> `optional` **wgsl?**: `object`

Defined in: [lib/shader-assembly/shader-injection-targets.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/shader-injection-targets.ts#L21)

WGSL signature and source surrounding injected statements.

#### footer?[​](#footer-1 "Direct link to footer?")

> `optional` **footer?**: `string`

#### header?[​](#header-1 "Direct link to header?")

> `optional` **header?**: `string`

#### parameters[​](#parameters-1 "Direct link to parameters")

> **parameters**: `string`

#### returnType?[​](#returntype-1 "Direct link to returnType?")

> `optional` **returnType?**: `string`
