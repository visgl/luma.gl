# Class: Computation

Defined in: [modules/engine/src/compute/computation.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L81)

v9 Model API A model

* automatically reuses pipelines (programs) when possible
* automatically rebuilds pipelines if necessary to accommodate changed settings shaders integration
* accepts modules and performs shader transpilation

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Computation**(`device`, `props`): `Computation`

Defined in: [modules/engine/src/compute/computation.ts:167](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L167)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`ComputationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ComputationProps.md)

#### Returns[​](#returns "Direct link to Returns")

`Computation`

## Properties[​](#properties "Direct link to Properties")

### \_lastLogTime[​](#_lastlogtime "Direct link to _lastLogTime")

> **\_lastLogTime**: `number` = `0`

Defined in: [modules/engine/src/compute/computation.ts:450](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L450)

Throttle draw call logging

***

### \_logOpen[​](#_logopen "Direct link to _logOpen")

> **\_logOpen**: `boolean` = `false`

Defined in: [modules/engine/src/compute/computation.ts:451](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L451)

***

### \_pipelineNeedsUpdate[​](#_pipelineneedsupdate "Direct link to _pipelineNeedsUpdate")

> **\_pipelineNeedsUpdate**: `string` | `false` = `'newly created'`

Defined in: [modules/engine/src/compute/computation.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L159)

***

### \_uniformStore[​](#_uniformstore "Direct link to _uniformStore")

> **\_uniformStore**: `UniformStore`

Defined in: [modules/engine/src/compute/computation.ts:157](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L157)

***

### bindings[​](#bindings "Direct link to bindings")

> **bindings**: `Record`<`string`, `Binding`> = `{}`

Defined in: [modules/engine/src/compute/computation.ts:143](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L143)

Bindings (textures, samplers, uniform buffers)

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/compute/computation.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L134)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/compute/computation.ts:135](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L135)

***

### pipeline[​](#pipeline "Direct link to pipeline")

> **pipeline**: `ComputePipeline`

Defined in: [modules/engine/src/compute/computation.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L146)

The underlying GPU pipeline.

***

### pipelineFactory[​](#pipelinefactory "Direct link to pipelineFactory")

> `readonly` **pipelineFactory**: `PipelineFactory`

Defined in: [modules/engine/src/compute/computation.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L137)

***

### shader[​](#shader "Direct link to shader")

> **shader**: `Shader`

Defined in: [modules/engine/src/compute/computation.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L151)

the underlying compiled compute shader

***

### shaderFactory[​](#shaderfactory "Direct link to shaderFactory")

> `readonly` **shaderFactory**: `ShaderFactory`

Defined in: [modules/engine/src/compute/computation.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L138)

***

### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

> **shaderInputs**: [`ShaderInputs`](https://luma.gl/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/compute/computation.ts:154](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L154)

ShaderInputs instance

***

### source[​](#source "Direct link to source")

> **source**: `string`

Defined in: [modules/engine/src/compute/computation.ts:148](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L148)

Assembled compute shader source

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `object` = `{}`

Defined in: [modules/engine/src/compute/computation.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L140)

#### Index Signature[​](#index-signature "Direct link to Index Signature")

\[`key`: `string`]: `unknown`

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`ComputationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ComputationProps.md)>

Defined in: [modules/engine/src/compute/computation.ts:112](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L112)

## Methods[​](#methods "Direct link to Methods")

### \_getBufferOrConstantValues()[​](#_getbufferorconstantvalues "Direct link to _getBufferOrConstantValues()")

> **\_getBufferOrConstantValues**(`attribute`, `dataType`): `string`

Defined in: [modules/engine/src/compute/computation.ts:485](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L485)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### attribute[​](#attribute "Direct link to attribute")

`TypedArray` | `Buffer`

##### dataType[​](#datatype "Direct link to dataType")

`any`

#### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### \_logDrawCallEnd()[​](#_logdrawcallend "Direct link to _logDrawCallEnd()")

> **\_logDrawCallEnd**(): `void`

Defined in: [modules/engine/src/compute/computation.ts:466](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L466)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### \_logDrawCallStart()[​](#_logdrawcallstart "Direct link to _logDrawCallStart()")

> **\_logDrawCallStart**(): `void`

Defined in: [modules/engine/src/compute/computation.ts:453](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L453)

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

***

### \_setPipelineNeedsUpdate()[​](#_setpipelineneedsupdate "Direct link to _setPipelineNeedsUpdate()")

> **\_setPipelineNeedsUpdate**(`reason`): `void`

Defined in: [modules/engine/src/compute/computation.ts:396](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L396)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### reason[​](#reason "Direct link to reason")

`string`

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### \_updatePipeline()[​](#_updatepipeline "Direct link to _updatePipeline()")

> **\_updatePipeline**(): `ComputePipeline`

Defined in: [modules/engine/src/compute/computation.ts:400](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L400)

#### Returns[​](#returns-5 "Direct link to Returns")

`ComputePipeline`

***

### \_updatePipelineAsync()[​](#_updatepipelineasync "Direct link to _updatePipelineAsync()")

> **\_updatePipelineAsync**(): `Promise`<`ComputePipeline`>

Defined in: [modules/engine/src/compute/computation.ts:410](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L410)

Creates or replaces the pipeline through the backend's asynchronous compilation path.

#### Returns[​](#returns-6 "Direct link to Returns")

`Promise`<`ComputePipeline`>

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/compute/computation.ts:276](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L276)

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### dispatch()[​](#dispatch "Direct link to dispatch()")

> **dispatch**(`computePass`, `x`, `y?`, `z?`): `void`

Defined in: [modules/engine/src/compute/computation.ts:295](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L295)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### computePass[​](#computepass "Direct link to computePass")

`ComputePass`

##### x[​](#x "Direct link to x")

`number`

##### y?[​](#y "Direct link to y?")

`number`

##### z?[​](#z "Direct link to z?")

`number`

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### dispatchIndirect()[​](#dispatchindirect "Direct link to dispatchIndirect()")

> **dispatchIndirect**(`computePass`, `indirectBuffer`, `indirectOffset?`): `void`

Defined in: [modules/engine/src/compute/computation.ts:306](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L306)

Dispatches a GPU-written workgroup count from an indirect buffer.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### computePass[​](#computepass-1 "Direct link to computePass")

`ComputePass`

##### indirectBuffer[​](#indirectbuffer "Direct link to indirectBuffer")

`Buffer`

##### indirectOffset?[​](#indirectoffset "Direct link to indirectOffset?")

`number` = `0`

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

***

### predraw()[​](#predraw "Direct link to predraw()")

> **predraw**(`commandEncoder`): `void`

Defined in: [modules/engine/src/compute/computation.ts:290](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L290)

Updates compute shader inputs before opening the compute pass that will consume them.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### setBindings()[​](#setbindings "Direct link to setBindings()")

> **setBindings**(`bindings`): `void`

Defined in: [modules/engine/src/compute/computation.ts:392](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L392)

Sets bindings (textures, samplers, uniform buffers)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### bindings[​](#bindings-1 "Direct link to bindings")

`Record`<`string`, `Binding`>

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

***

### setInstanceCount()[​](#setinstancecount "Direct link to setInstanceCount()")

> **setInstanceCount**(`instanceCount`): `void`

Defined in: [modules/engine/src/compute/computation.ts:344](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L344)

Updates the instance count (used in draw calls)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### instanceCount[​](#instancecount "Direct link to instanceCount")

`number`

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Note[​](#note "Direct link to Note")

Any attributes with stepMode=instance need to be at least this big

***

### setShaderInputs()[​](#setshaderinputs "Direct link to setShaderInputs()")

> **setShaderInputs**(`shaderInputs`): `void`

Defined in: [modules/engine/src/compute/computation.ts:348](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L348)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### shaderInputs[​](#shaderinputs-1 "Direct link to shaderInputs")

[`ShaderInputs`](https://luma.gl/docs/api-reference/generated/engine/classes/ShaderInputs.md)

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

***

### setShaderModuleProps()[​](#setshadermoduleprops "Direct link to setShaderModuleProps()")

> **setShaderModuleProps**(`props`): `void`

Defined in: [modules/engine/src/compute/computation.ts:363](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L363)

Updates shader module settings (which results in uniforms being set)

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

`Record`<`string`, `any`>

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

***

### setVertexCount()[​](#setvertexcount "Direct link to setVertexCount()")

> **setVertexCount**(`vertexCount`): `void`

Defined in: [modules/engine/src/compute/computation.ts:336](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L336)

Updates the vertex count (used in draw calls)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### vertexCount[​](#vertexcount "Direct link to vertexCount")

`number`

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

#### Note[​](#note-1 "Direct link to Note")

Any attributes with stepMode=vertex need to be at least this big

***

### updateShaderInputs()[​](#updateshaderinputs "Direct link to updateShaderInputs()")

> **updateShaderInputs**(`commandEncoder?`): `void`

Defined in: [modules/engine/src/compute/computation.ts:385](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L385)

Flushes current shader-input values into the internal uniform store.

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### commandEncoder?[​](#commandencoder-1 "Direct link to commandEncoder?")

`CommandEncoder`

Optional encoder used to order uniform uploads with subsequent compute commands.

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

***

### createAsync()[​](#createasync "Direct link to createAsync()")

> `static` **createAsync**(`device`, `props`): `Promise`<`Computation`>

Defined in: [modules/engine/src/compute/computation.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/computation.ts#L88)

Creates a computation while allowing the backend to compile its pipeline asynchronously.

Use this factory when several independent computations can be prepared together. Calling the constructor remains the synchronous compatibility path.

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### device[​](#device-2 "Direct link to device")

`Device`

##### props[​](#props-2 "Direct link to props")

[`ComputationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/ComputationProps.md)

#### Returns[​](#returns-17 "Direct link to Returns")

`Promise`<`Computation`>
