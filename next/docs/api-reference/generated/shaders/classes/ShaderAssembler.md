# Abstract Class: ShaderAssembler

Defined in: [lib/shader-assembler-base.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L21)

A stateful version of `assembleShaders` that can be used to assemble shaders. Supports setting of default modules and hooks.

## Extended by[​](#extended-by "Direct link to Extended by")

* [`GLSLShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/GLSLShaderAssembler.md)
* [`WGSLShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/WGSLShaderAssembler.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ShaderAssembler**(): `ShaderAssembler`

#### Returns[​](#returns "Direct link to Returns")

`ShaderAssembler`

## Properties[​](#properties "Direct link to Properties")

### shaderLanguage[​](#shaderlanguage "Direct link to shaderLanguage")

> `abstract` `readonly` **shaderLanguage**: `"glsl"` | `"wgsl"`

Defined in: [lib/shader-assembler-base.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L23)

Shader language accepted by this assembler.

## Methods[​](#methods "Direct link to Methods")

### \_getModuleList()[​](#_getmodulelist "Direct link to _getModuleList()")

> **\_getModuleList**(`appModules?`): [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

Defined in: [lib/shader-assembler-base.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L144)

Dedupe and combine with default modules

#### Parameters[​](#parameters "Direct link to Parameters")

##### appModules?[​](#appmodules "Direct link to appModules?")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[] = `[]`

#### Returns[​](#returns-1 "Direct link to Returns")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

***

### addDefaultModule()[​](#adddefaultmodule "Direct link to addDefaultModule()")

> **addDefaultModule**(`module`): `void`

Defined in: [lib/shader-assembler-base.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L105)

Add a default module that does not have to be provided with every assembly call.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### module[​](#module "Direct link to module")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

Shader module to include in later assembly calls.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### addShaderHook()[​](#addshaderhook "Direct link to addShaderHook()")

> **addShaderHook**(`hook`, `options?`): `void`

Defined in: [lib/shader-assembler-base.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L129)

Register a shader hook

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### hook[​](#hook "Direct link to hook")

`string`

Stage-prefixed hook signature, such as `vs:OFFSET_POSITION(inout vec4 position)`.

##### options?[​](#options "Direct link to options?")

[`ShaderHookOptions`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderHookOptions.md)

Optional hook metadata such as always-on header and footer source.

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

***

### addShaderTranspiler()[​](#addshadertranspiler "Direct link to addShaderTranspiler()")

> **addShaderTranspiler**(`transpiler`): `void`

Defined in: [lib/shader-assembler-base.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L32)

Register or replace the compiler for one input language.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### transpiler[​](#transpiler "Direct link to transpiler")

[`ShaderTranspiler`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderTranspiler.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### removeDefaultModule()[​](#removedefaultmodule "Direct link to removeDefaultModule()")

> **removeDefaultModule**(`module`): `void`

Defined in: [lib/shader-assembler-base.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L119)

Remove a default module

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### module[​](#module-1 "Direct link to module")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

Shader module to remove from later assembly calls.

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### removeShaderTranspiler()[​](#removeshadertranspiler "Direct link to removeShaderTranspiler()")

> **removeShaderTranspiler**(`sourceLanguage`): `void`

Defined in: [lib/shader-assembler-base.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L37)

Remove the compiler for one input language.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### sourceLanguage[​](#sourcelanguage "Direct link to sourceLanguage")

`string`

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### resetShaderHooks()[​](#resetshaderhooks "Direct link to resetShaderHooks()")

> **resetShaderHooks**(): `void`

Defined in: [lib/shader-assembler-base.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L137)

Remove all registered shader hooks, for example before re-registering hooks for a new application configuration. Default modules are not affected.

#### Returns[​](#returns-7 "Direct link to Returns")

`void`
