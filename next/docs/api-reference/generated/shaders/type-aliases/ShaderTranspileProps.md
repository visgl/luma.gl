# Type Alias: ShaderTranspileProps

> **ShaderTranspileProps** = `object`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L14)

One translation unit, including source-language module dependencies.

## Properties[​](#properties "Direct link to Properties")

### entryPoints[​](#entrypoints "Direct link to entryPoints")

> **entryPoints**: [`ShaderTranspilerEntryPoints`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderTranspilerEntryPoints.md)

Defined in: [lib/shader-transpiler/shader-transpiler.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L19)

***

### platformInfo[​](#platforminfo "Direct link to platformInfo")

> **platformInfo**: [`PlatformInfo`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PlatformInfo.md)

Defined in: [lib/shader-transpiler/shader-transpiler.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L20)

***

### source[​](#source "Direct link to source")

> **source**: `string`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L15)

***

### stage?[​](#stage "Direct link to stage?")

> `optional` **stage?**: `"vertex"` | `"fragment"` | `"compute"`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L18)

GLSL compiles one stage at a time; WGSL may compile a unified render program.

***

### target[​](#target "Direct link to target")

> **target**: `"glsl"` | `"wgsl"`

Defined in: [lib/shader-transpiler/shader-transpiler.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-transpiler/shader-transpiler.ts#L16)
