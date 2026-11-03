# Class: WGSLShaderAssembler

Defined in: [lib/wgsl-shader-assembler.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/wgsl-shader-assembler.ts#L19)

Stateful assembler for unified WGSL shaders.

## Extends[​](#extends "Direct link to Extends")

* [`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new WGSLShaderAssembler**(): `WGSLShaderAssembler`

#### Returns[​](#returns "Direct link to Returns")

`WGSLShaderAssembler`

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### shaderLanguage[​](#shaderlanguage "Direct link to shaderLanguage")

> `readonly` **shaderLanguage**: `"wgsl"` = `'wgsl'`

Defined in: [lib/wgsl-shader-assembler.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/wgsl-shader-assembler.ts#L20)

Shader language accepted by this assembler.

#### Overrides[​](#overrides "Direct link to Overrides")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`shaderLanguage`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#shaderlanguage)

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

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`_getModuleList`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#_getmodulelist)

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

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`addDefaultModule`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#adddefaultmodule)

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

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`addShaderHook`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#addshaderhook)

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

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`addShaderTranspiler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#addshadertranspiler)

***

### assembleWGSLShader()[​](#assemblewgslshader "Direct link to assembleWGSLShader()")

> **assembleWGSLShader**(`props`): `object`

Defined in: [lib/wgsl-shader-assembler.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/wgsl-shader-assembler.ts#L29)

Assemble a WGSL unified shader.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### props[​](#props "Direct link to props")

`AssembleShaderProps`

WGSL source, platform information, shader modules, defines, and injections.

#### Returns[​](#returns-5 "Direct link to Returns")

`object`

Assembled WGSL source, resolved modules, uniforms, and binding debug metadata.

##### bindingAssignments[​](#bindingassignments "Direct link to bindingAssignments")

> **bindingAssignments**: `object`\[]

##### bindingTable[​](#bindingtable "Direct link to bindingTable")

> **bindingTable**: [`ShaderBindingDebugRow`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderBindingDebugRow.md)\[]

##### entryPoints[​](#entrypoints "Direct link to entryPoints")

> **entryPoints**: [`ShaderTranspilerEntryPoints`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderTranspilerEntryPoints.md)

##### getUniforms[​](#getuniforms "Direct link to getUniforms")

> **getUniforms**: `GetUniformsFunc`

##### modules[​](#modules "Direct link to modules")

> **modules**: [`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

##### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

> **shaderLayout**: `ShaderLayout` | `null`

##### source[​](#source "Direct link to source")

> **source**: `string`

***

### removeDefaultModule()[​](#removedefaultmodule "Direct link to removeDefaultModule()")

> **removeDefaultModule**(`module`): `void`

Defined in: [lib/shader-assembler-base.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L119)

Remove a default module

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### module[​](#module-1 "Direct link to module")

[`ShaderModule`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

Shader module to remove from later assembly calls.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`removeDefaultModule`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#removedefaultmodule)

***

### removeShaderTranspiler()[​](#removeshadertranspiler "Direct link to removeShaderTranspiler()")

> **removeShaderTranspiler**(`sourceLanguage`): `void`

Defined in: [lib/shader-assembler-base.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L37)

Remove the compiler for one input language.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### sourceLanguage[​](#sourcelanguage "Direct link to sourceLanguage")

`string`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`removeShaderTranspiler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#removeshadertranspiler)

***

### resetShaderHooks()[​](#resetshaderhooks "Direct link to resetShaderHooks()")

> **resetShaderHooks**(): `void`

Defined in: [lib/shader-assembler-base.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L137)

Remove all registered shader hooks, for example before re-registering hooks for a new application configuration. Default modules are not affected.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`resetShaderHooks`](https://luma.gl/next/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#resetshaderhooks)
