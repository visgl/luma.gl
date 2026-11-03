# Class: ShaderInputs\<ShaderPropsT>

Defined in: [modules/engine/src/shader-inputs.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L42)

ShaderInputs holds uniform and binding values for one or more shader modules,

* It can generate binary data for any uniform buffer
* It can manage a uniform buffer for each block
* It can update managed uniform buffers with a single call
* It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### ShaderPropsT[​](#shaderpropst "Direct link to ShaderPropsT")

`ShaderPropsT` *extends* `Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>> = `Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ShaderInputs**<`ShaderPropsT`>(`modules`, `options?`): `ShaderInputs`<`ShaderPropsT`>

Defined in: [modules/engine/src/shader-inputs.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L69)

Creates shader input storage for one or more shader modules.

#### Parameters[​](#parameters "Direct link to Parameters")

##### modules[​](#modules "Direct link to modules")

{ \[P in string | number | symbol]?: ShaderInputsModule }

Initial shader modules keyed by module name.

##### options?[​](#options "Direct link to options?")

`ShaderInputsOptions`

Shader input behavior options.

#### Returns[​](#returns "Direct link to Returns")

`ShaderInputs`<`ShaderPropsT`>

## Properties[​](#properties "Direct link to Properties")

### directBindings[​](#directbindings "Direct link to directBindings")

> **directBindings**: `Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)> = `{}`

Defined in: [modules/engine/src/shader-inputs.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L60)

Stores shader resource bindings that are not owned by a shader module.

***

### moduleBindings[​](#modulebindings "Direct link to moduleBindings")

> **moduleBindings**: `Record`\<keyof `ShaderPropsT`, `Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)>>

Defined in: [modules/engine/src/shader-inputs.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L58)

Stores resource bindings for each module.

***

### modules[​](#modules-1 "Direct link to modules")

> **modules**: `Readonly`<`{ [P in keyof ShaderPropsT]: ShaderInputsModule }`>

Defined in: [modules/engine/src/shader-inputs.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L53)

Registered shader modules, including resolved dependencies.

***

### moduleUniforms[​](#moduleuniforms "Direct link to moduleUniforms")

> **moduleUniforms**: `Record`\<keyof `ShaderPropsT`, `Record`<`string`, `ShaderModuleUniformValue`>>

Defined in: [modules/engine/src/shader-inputs.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L56)

Stores the uniform values for each module

***

### options[​](#options-1 "Direct link to options")

> **options**: `Required`<`ShaderInputsOptions`>

Defined in: [modules/engine/src/shader-inputs.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L47)

## Methods[​](#methods "Direct link to Methods")

### \_addModule()[​](#_addmodule "Direct link to _addModule()")

> **\_addModule**(`module`): `void`

Defined in: [modules/engine/src/shader-inputs.ts:223](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L223)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### module[​](#module "Direct link to module")

`ShaderInputsModule`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### addModules()[​](#addmodules "Direct link to addModules()")

> **addModules**(`modules`): `void`

Defined in: [modules/engine/src/shader-inputs.ts:164](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L164)

Adds shader modules that should participate in subsequent uniform and binding updates. Module dependencies are resolved before new module state is initialized.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### modules[​](#modules-2 "Direct link to modules")

`ShaderInputsModule`\[]

Shader modules to register after construction.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/shader-inputs.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L108)

Destroy

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

***

### getBindingValues()[​](#getbindingvalues "Direct link to getBindingValues()")

> **getBindingValues**(): `Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)>

Defined in: [modules/engine/src/shader-inputs.ts:185](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L185)

Merges concrete and deferred bindings for the shader from the registered modules.

#### Returns[​](#returns-4 "Direct link to Returns")

`Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)>

***

### getDebugTable()[​](#getdebugtable "Direct link to getDebugTable()")

> **getDebugTable**(): `Record`<`string`, `Record`<`string`, `unknown`>>

Defined in: [modules/engine/src/shader-inputs.ts:210](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L210)

Return a debug table that can be used for console.table() or log.table()

#### Returns[​](#returns-5 "Direct link to Returns")

`Record`<`string`, `Record`<`string`, `unknown`>>

***

### getModuleBindingValues()[​](#getmodulebindingvalues "Direct link to getModuleBindingValues()")

> **getModuleBindingValues**(`moduleName`): `Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)>

Defined in: [modules/engine/src/shader-inputs.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L200)

Gets binding values for a single shader module without flattening them into the full shader map.

This is used by systems such as [ShaderPassRenderer](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md) that execute one shader module at a time and need the defaults for just that module.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### moduleName[​](#modulename "Direct link to moduleName")

`string` | keyof `ShaderPropsT`

#### Returns[​](#returns-6 "Direct link to Returns")

`Record`<`string`, [`ShaderInputBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputBinding.md)>

***

### getModules()[​](#getmodules "Direct link to getModules()")

> **getModules**(): `ShaderModule`\[]

Defined in: [modules/engine/src/shader-inputs.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L155)

Returns registered shader modules, including resolved dependencies.

#### Returns[​](#returns-7 "Direct link to Returns")

`ShaderModule`\[]

***

### getUniformValues()[​](#getuniformvalues "Direct link to getUniformValues()")

> **getUniformValues**(): `Partial`<`Record`\<keyof `ShaderPropsT`, `Record`<`string`, `ShaderModuleUniformValue`>>>

Defined in: [modules/engine/src/shader-inputs.ts:178](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L178)

Get all uniform values for all modules

#### Returns[​](#returns-8 "Direct link to Returns")

`Partial`<`Record`\<keyof `ShaderPropsT`, `Record`<`string`, `ShaderModuleUniformValue`>>>

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `void`

Defined in: [modules/engine/src/shader-inputs.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/shader-inputs.ts#L113)

Set module props

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`ShaderInputsProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderInputsProps.md)<`ShaderPropsT`>

#### Returns[​](#returns-9 "Direct link to Returns")

`void`
