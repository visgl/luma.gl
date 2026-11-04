# Class: GLSLShaderAssembler

Defined in: [lib/glsl-shader-assembler.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/glsl-shader-assembler.ts#L11)

Stateful assembler for GLSL vertex and fragment shaders.

## Extends[​](#extends "Direct link to Extends")

* [`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new GLSLShaderAssembler**(): `GLSLShaderAssembler`

#### Returns[​](#returns "Direct link to Returns")

`GLSLShaderAssembler`

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`constructor`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### shaderLanguage[​](#shaderlanguage "Direct link to shaderLanguage")

> `readonly` **shaderLanguage**: `"glsl"` = `'glsl'`

Defined in: [lib/glsl-shader-assembler.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/glsl-shader-assembler.ts#L12)

Shader language accepted by this assembler.

#### Overrides[​](#overrides "Direct link to Overrides")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`shaderLanguage`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#shaderlanguage)

## Methods[​](#methods "Direct link to Methods")

### \_getModuleList()[​](#_getmodulelist "Direct link to _getModuleList()")

> **\_getModuleList**(`appModules?`): [`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

Defined in: [lib/shader-assembler-base.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L143)

Dedupe and combine with default modules

#### Parameters[​](#parameters "Direct link to Parameters")

##### appModules?[​](#appmodules "Direct link to appModules?")

[`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[] = `[]`

#### Returns[​](#returns-1 "Direct link to Returns")

[`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`_getModuleList`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#_getmodulelist)

***

### addDefaultModule()[​](#adddefaultmodule "Direct link to addDefaultModule()")

> **addDefaultModule**(`module`): `void`

Defined in: [lib/shader-assembler-base.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L105)

Add a default module that does not have to be provided with every assembly call.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### module[​](#module "Direct link to module")

[`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

Shader module to include in later assembly calls.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`addDefaultModule`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#adddefaultmodule)

***

### addShaderInjectionTarget()[​](#addshaderinjectiontarget "Direct link to addShaderInjectionTarget()")

> **addShaderInjectionTarget**(`injectionTarget`): `void`

Defined in: [lib/shader-assembler-base.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L128)

Register a shader injection target

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### injectionTarget[​](#injectiontarget "Direct link to injectionTarget")

[`ShaderInjectionTarget`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderInjectionTarget.md)

Shared stage and name with language-specific parameters, return type, and source.

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`addShaderInjectionTarget`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#addshaderinjectiontarget)

***

### addShaderTranspiler()[​](#addshadertranspiler "Direct link to addShaderTranspiler()")

> **addShaderTranspiler**(`transpiler`): `void`

Defined in: [lib/shader-assembler-base.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L32)

Register or replace the compiler for one input language.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### transpiler[​](#transpiler "Direct link to transpiler")

[`ShaderTranspiler`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderTranspiler.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`addShaderTranspiler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#addshadertranspiler)

***

### assembleGLSLShaderPair()[​](#assembleglslshaderpair "Direct link to assembleGLSLShaderPair()")

> **assembleGLSLShaderPair**(`props`): `object`

Defined in: [lib/glsl-shader-assembler.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/glsl-shader-assembler.ts#L19)

Assemble a pair of shaders into a single shader program.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### props[​](#props "Direct link to props")

`AssembleShaderProps`

GLSL vertex and fragment source, platform information, shader modules, defines, and injections.

#### Returns[​](#returns-5 "Direct link to Returns")

`object`

Assembled GLSL source, resolved modules, and combined uniform getter.

##### fs[​](#fs "Direct link to fs")

> **fs**: `string`

##### getUniforms[​](#getuniforms "Direct link to getUniforms")

> **getUniforms**: `GetUniformsFunc`

##### modules[​](#modules "Direct link to modules")

> **modules**: [`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)\[]

##### vs[​](#vs "Direct link to vs")

> **vs**: `string`

***

### removeDefaultModule()[​](#removedefaultmodule "Direct link to removeDefaultModule()")

> **removeDefaultModule**(`module`): `void`

Defined in: [lib/shader-assembler-base.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L119)

Remove a default module

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### module[​](#module-1 "Direct link to module")

[`ShaderModule`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/ShaderModule.md)

Shader module to remove from later assembly calls.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`removeDefaultModule`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#removedefaultmodule)

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

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`removeShaderTranspiler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#removeshadertranspiler)

***

### resetShaderInjectionTargets()[​](#resetshaderinjectiontargets "Direct link to resetShaderInjectionTargets()")

> **resetShaderInjectionTargets**(): `void`

Defined in: [lib/shader-assembler-base.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembler-base.ts#L136)

Remove all registered shader injection targets, for example before re-registering targets for a new application configuration. Default modules are not affected.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`ShaderAssembler`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md).[`resetShaderInjectionTargets`](https://luma.gl/docs/api-reference/generated/shaders/classes/ShaderAssembler.md#resetshaderinjectiontargets)
