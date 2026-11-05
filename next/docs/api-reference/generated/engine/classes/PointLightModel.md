# Class: PointLightModel

Defined in: [modules/engine/src/models/point-light-model.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/point-light-model.ts#L21)

## Extends[​](#extends "Direct link to Extends")

* `BaseLightModel`<[`PointLightModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PointLightModelProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new PointLightModel**(`device`, `props`): `PointLightModel`

Defined in: [modules/engine/src/models/point-light-model.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/point-light-model.ts#L22)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`PointLightModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PointLightModelProps.md)

#### Returns[​](#returns "Direct link to Returns")

`PointLightModel`

#### Overrides[​](#overrides "Direct link to Overrides")

`BaseLightModel<PointLightModelProps>.constructor`

## Properties[​](#properties "Direct link to Properties")

### \_attributeInfos[​](#_attributeinfos "Direct link to _attributeInfos")

> **\_attributeInfos**: `Record`<`string`, `AttributeInfo`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:362](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L362)

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

`BaseLightModel._attributeInfos`

***

### \_gpuGeometry[​](#_gpugeometry "Direct link to _gpuGeometry")

> **\_gpuGeometry**: [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null`

Defined in: [modules/engine/src/model/model.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L35)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

`BaseLightModel._gpuGeometry`

***

### \_lastDrawTimestamp[​](#_lastdrawtimestamp "Direct link to _lastDrawTimestamp")

> **\_lastDrawTimestamp**: `number` = `-1`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:389](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L389)

"Time" of last draw. Monotonically increasing timestamp

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

`BaseLightModel._lastDrawTimestamp`

***

### \_lastLogTime[​](#_lastlogtime "Direct link to _lastLogTime")

> **\_lastLogTime**: `number` = `0`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1717](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1717)

Throttle draw call logging

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

`BaseLightModel._lastLogTime`

***

### \_logOpen[​](#_logopen "Direct link to _logOpen")

> **\_logOpen**: `boolean` = `false`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1718](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1718)

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

`BaseLightModel._logOpen`

***

### \_pipelineNeedsUpdate[​](#_pipelineneedsupdate "Direct link to _pipelineNeedsUpdate")

> **\_pipelineNeedsUpdate**: `string` | `false` = `'newly created'`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:382](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L382)

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

`BaseLightModel._pipelineNeedsUpdate`

***

### \_uniformStore[​](#_uniformstore "Direct link to _uniformStore")

> **\_uniformStore**: `UniformStore`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:360](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L360)

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

`BaseLightModel._uniformStore`

***

### bindings[​](#bindings "Direct link to bindings")

> **bindings**: `Record`<`string`, `ModelBinding`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:341](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L341)

Bindings (textures, samplers, uniform buffers)

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

`BaseLightModel.bindings`

***

### bufferAttributes[​](#bufferattributes "Direct link to bufferAttributes")

> **bufferAttributes**: `Record`<`string`, `Buffer`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:337](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L337)

Buffer-valued attributes

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

`BaseLightModel.bufferAttributes`

***

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> **bufferLayout**: `BufferLayout`\[]

Defined in: [modules/engine/src/model/gpu-vector-model.ts:317](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L317)

Buffer layout

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

`BaseLightModel.bufferLayout`

***

### constantAttributes[​](#constantattributes "Direct link to constantAttributes")

> **constantAttributes**: `Record`<`string`, `TypedArray`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:339](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L339)

Constant-valued attributes

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

`BaseLightModel.constantAttributes`

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:290](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L290)

Device that created this model

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

`BaseLightModel.device`

***

### firstIndex[​](#firstindex "Direct link to firstIndex")

> **firstIndex**: `number`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:332](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L332)

First index element for WebGPU indexed draws.

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

`BaseLightModel.firstIndex`

***

### firstVertex[​](#firstvertex "Direct link to firstVertex")

> **firstVertex**: `number`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:330](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L330)

First vertex byte offset for WebGL indexed draws or first vertex for non-indexed draws.

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

`BaseLightModel.firstVertex`

***

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:301](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L301)

GLSL fragment shader source

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

`BaseLightModel.fs`

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:292](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L292)

Application provided identifier

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

`BaseLightModel.id`

***

### indexBuffer[​](#indexbuffer "Direct link to indexBuffer")

> **indexBuffer**: `Buffer` | `null` = `null`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:335](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L335)

Index buffer

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

`BaseLightModel.indexBuffer`

***

### indexCount[​](#indexcount "Direct link to indexCount")

> **indexCount**: `number` | `undefined`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:328](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L328)

Indexed draw count override. Undefined uses vertexCount, then the full bound index buffer.

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

`BaseLightModel.indexCount`

***

### instanceCount[​](#instancecount "Direct link to instanceCount")

> **instanceCount**: `number` = `0`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:324](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L324)

instance count. `undefined` means not instanced

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

`BaseLightModel.instanceCount`

***

### isInstanced[​](#isinstanced "Direct link to isInstanced")

> **isInstanced**: `boolean` | `undefined` = `undefined`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:322](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L322)

Use instanced rendering

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

`BaseLightModel.isInstanced`

***

### material[​](#material "Direct link to material")

> **material**: [`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)<`Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>, `MaterialBindings`> | `null`

Defined in: [modules/engine/src/model/model.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L34)

#### Inherited from[​](#inherited-from-20 "Direct link to Inherited from")

`BaseLightModel.material`

***

### parameters[​](#parameters-1 "Direct link to parameters")

> **parameters**: `RenderPipelineParameters`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:312](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L312)

The render pipeline GPU parameters, depth testing etc

#### Inherited from[​](#inherited-from-21 "Direct link to Inherited from")

`BaseLightModel.parameters`

***

### pipeline[​](#pipeline "Direct link to pipeline")

> **pipeline**: `RenderPipeline`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:354](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L354)

The underlying GPU "program".

#### Note[​](#note "Direct link to Note")

May be recreated if parameters change

#### Inherited from[​](#inherited-from-22 "Direct link to Inherited from")

`BaseLightModel.pipeline`

***

### pipelineFactory[​](#pipelinefactory "Direct link to pipelineFactory")

> `readonly` **pipelineFactory**: `PipelineFactory`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:303](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L303)

Factory used to create render pipelines

#### Inherited from[​](#inherited-from-23 "Direct link to Inherited from")

`BaseLightModel.pipelineFactory`

***

### shaderFactory[​](#shaderfactory "Direct link to shaderFactory")

> `readonly` **shaderFactory**: `ShaderFactory`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:305](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L305)

Factory used to create shaders

#### Inherited from[​](#inherited-from-24 "Direct link to Inherited from")

`BaseLightModel.shaderFactory`

***

### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

> **shaderInputs**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/model/gpu-vector-model.ts:358](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L358)

ShaderInputs instance

#### Inherited from[​](#inherited-from-25 "Direct link to Inherited from")

`BaseLightModel.shaderInputs`

***

### source[​](#source "Direct link to source")

> `readonly` **source**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:295](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L295)

WGSL shader source when using unified shader

#### Inherited from[​](#inherited-from-26 "Direct link to Inherited from")

`BaseLightModel.source`

***

### topology[​](#topology "Direct link to topology")

> **topology**: `PrimitiveTopology`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:315](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L315)

The primitive topology

#### Inherited from[​](#inherited-from-27 "Direct link to Inherited from")

`BaseLightModel.topology`

***

### transformFeedback[​](#transformfeedback "Direct link to transformFeedback")

> **transformFeedback**: `TransformFeedback` | `null` = `null`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:351](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L351)

TransformFeedback, WebGL 2 only.

#### Inherited from[​](#inherited-from-28 "Direct link to Inherited from")

`BaseLightModel.transformFeedback`

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `object` = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:307](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L307)

User-supplied per-model data

#### Index Signature[​](#index-signature "Direct link to Index Signature")

\[`key`: `string`]: `unknown`

#### Inherited from[​](#inherited-from-29 "Direct link to Inherited from")

`BaseLightModel.userData`

***

### vertexArray[​](#vertexarray "Direct link to vertexArray")

> **vertexArray**: `VertexArray`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:348](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L348)

VertexArray

#### Note[​](#note-1 "Direct link to Note")

not implemented: if bufferLayout is updated, vertex array has to be rebuilt!

#### Todo[​](#todo "Direct link to Todo")

* allow application to define multiple vertex arrays?

#### Inherited from[​](#inherited-from-30 "Direct link to Inherited from")

`BaseLightModel.vertexArray`

***

### vertexCount[​](#vertexcount "Direct link to vertexCount")

> **vertexCount**: `number`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:326](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L326)

Vertex count

#### Inherited from[​](#inherited-from-31 "Direct link to Inherited from")

`BaseLightModel.vertexCount`

***

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:298](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L298)

GLSL vertex shader source

#### Inherited from[​](#inherited-from-32 "Direct link to Inherited from")

`BaseLightModel.vs`

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`GPUVectorModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md)> & `object`

Defined in: [modules/engine/src/model/model.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L29)

#### Type Declaration[​](#type-declaration "Direct link to Type Declaration")

##### material[​](#material-1 "Direct link to material")

> **material**: [`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)

#### Inherited from[​](#inherited-from-33 "Direct link to Inherited from")

`BaseLightModel.defaultProps`

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:393](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L393)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-34 "Direct link to Inherited from")

`BaseLightModel.[toStringTag]`

***

### sourceGeometry[​](#sourcegeometry "Direct link to sourceGeometry")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **sourceGeometry**(): `Geometry` | [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null` | `undefined`

Defined in: [modules/engine/src/model/model.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L40)

Borrowed source geometry, retained for scene adapters such as physics cooking.

##### Returns[​](#returns-2 "Direct link to Returns")

`Geometry` | [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null` | `undefined`

#### Inherited from[​](#inherited-from-35 "Direct link to Inherited from")

`BaseLightModel.sourceGeometry`

## Methods[​](#methods "Direct link to Methods")

### \_areBindingsLoading()[​](#_arebindingsloading "Direct link to _areBindingsLoading()")

> **\_areBindingsLoading**(): `string` | `false`

Defined in: [modules/engine/src/model/model.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L132)

Check that bindings are loaded. Returns id of first binding that is still loading.

#### Returns[​](#returns-3 "Direct link to Returns")

`string` | `false`

#### Inherited from[​](#inherited-from-36 "Direct link to Inherited from")

`BaseLightModel._areBindingsLoading`

***

### \_getAttributeDebugTable()[​](#_getattributedebugtable "Direct link to _getAttributeDebugTable()")

> **\_getAttributeDebugTable**(): `Record`<`string`, `Record`<`string`, `unknown`>>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1769](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1769)

#### Returns[​](#returns-4 "Direct link to Returns")

`Record`<`string`, `Record`<`string`, `unknown`>>

#### Inherited from[​](#inherited-from-37 "Direct link to Inherited from")

`BaseLightModel._getAttributeDebugTable`

***

### \_getBindGroupCacheKeys()[​](#_getbindgroupcachekeys "Direct link to _getBindGroupCacheKeys()")

> **\_getBindGroupCacheKeys**(): `Partial`<`Record`<`number`, `object`>>

Defined in: [modules/engine/src/model/model.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L155)

#### Returns[​](#returns-5 "Direct link to Returns")

`Partial`<`Record`<`number`, `object`>>

#### Inherited from[​](#inherited-from-38 "Direct link to Inherited from")

`BaseLightModel._getBindGroupCacheKeys`

***

### \_getBindGroups()[​](#_getbindgroups "Direct link to _getBindGroups()")

> **\_getBindGroups**(`shaderLayout?`, `bindings?`): `BindingsByGroup`

Defined in: [modules/engine/src/model/model.ts:141](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L141)

Groups resolved resource bindings for the current shader layout.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### shaderLayout?[​](#shaderlayout "Direct link to shaderLayout?")

`AnyShaderLayout` = `...`

Reflected bindings used to group logical binding names.

##### bindings?[​](#bindings-1 "Direct link to bindings?")

`Record`<`string`, `Binding`> = `...`

GPUVectorModel bindings already resolved for this draw preparation.

#### Returns[​](#returns-6 "Direct link to Returns")

`BindingsByGroup`

#### Inherited from[​](#inherited-from-39 "Direct link to Inherited from")

`BaseLightModel._getBindGroups`

***

### \_getBindings()[​](#_getbindings "Direct link to _getBindings()")

> **\_getBindings**(`shaderLayout?`): `Record`<`string`, `Binding`>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1524](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1524)

Resolves ready model bindings for the current shader layout.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### shaderLayout?[​](#shaderlayout-1 "Direct link to shaderLayout?")

`AnyShaderLayout` = `...`

Reflected bindings used to select copied or external texture resolution.

#### Returns[​](#returns-7 "Direct link to Returns")

`Record`<`string`, `Binding`>

#### Inherited from[​](#inherited-from-40 "Direct link to Inherited from")

`BaseLightModel._getBindings`

***

### \_getBindingsUpdateTimestamp()[​](#_getbindingsupdatetimestamp "Direct link to _getBindingsUpdateTimestamp()")

> **\_getBindingsUpdateTimestamp**(): `number`

Defined in: [modules/engine/src/model/model.ts:160](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L160)

Get the timestamp of the latest updated bound GPU memory resource (buffer/texture).

#### Returns[​](#returns-8 "Direct link to Returns")

`number`

#### Inherited from[​](#inherited-from-41 "Direct link to Inherited from")

`BaseLightModel._getBindingsUpdateTimestamp`

***

### \_getBufferOrConstantValues()[​](#_getbufferorconstantvalues "Direct link to _getBufferOrConstantValues()")

> **\_getBufferOrConstantValues**(`attribute`, `dataType`): `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1797](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1797)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### attribute[​](#attribute "Direct link to attribute")

`TypedArray` | `Buffer`

##### dataType[​](#datatype "Direct link to dataType")

`any`

#### Returns[​](#returns-9 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-42 "Direct link to Inherited from")

`BaseLightModel._getBufferOrConstantValues`

***

### \_logDrawCallEnd()[​](#_logdrawcallend "Direct link to _logDrawCallEnd()")

> **\_logDrawCallEnd**(): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1733](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1733)

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-43 "Direct link to Inherited from")

`BaseLightModel._logDrawCallEnd`

***

### \_logDrawCallStart()[​](#_logdrawcallstart "Direct link to _logDrawCallStart()")

> **\_logDrawCallStart**(): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1720](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1720)

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-44 "Direct link to Inherited from")

`BaseLightModel._logDrawCallStart`

***

### \_logFramebuffer()[​](#_logframebuffer "Direct link to _logFramebuffer()")

> **\_logFramebuffer**(`renderPass`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1754](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1754)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### renderPass[​](#renderpass "Direct link to renderPass")

`RenderPass`

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-45 "Direct link to Inherited from")

`BaseLightModel._logFramebuffer`

***

### \_setPipelineNeedsUpdate()[​](#_setpipelineneedsupdate "Direct link to _setPipelineNeedsUpdate()")

> **\_setPipelineNeedsUpdate**(`reason`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1595](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1595)

Mark pipeline as needing update

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### reason[​](#reason "Direct link to reason")

`string`

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-46 "Direct link to Inherited from")

`BaseLightModel._setPipelineNeedsUpdate`

***

### \_updatePipeline()[​](#_updatepipeline "Direct link to _updatePipeline()")

> **\_updatePipeline**(): `RenderPipeline`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1602](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1602)

Update pipeline if needed

#### Returns[​](#returns-14 "Direct link to Returns")

`RenderPipeline`

#### Inherited from[​](#inherited-from-47 "Direct link to Inherited from")

`BaseLightModel._updatePipeline`

***

### \_updatePipelineAsync()[​](#_updatepipelineasync "Direct link to _updatePipelineAsync()")

> **\_updatePipelineAsync**(): `Promise`<`RenderPipeline`>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1618](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1618)

Creates or replaces the render pipeline through the backend's asynchronous compilation path.

#### Returns[​](#returns-15 "Direct link to Returns")

`Promise`<`RenderPipeline`>

#### Inherited from[​](#inherited-from-48 "Direct link to Inherited from")

`BaseLightModel._updatePipelineAsync`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/models/light-model-utils.ts:152](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/light-model-utils.ts#L152)

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-49 "Direct link to Inherited from")

`BaseLightModel.destroy`

***

### draw()[​](#draw "Direct link to draw()")

> **draw**(`renderPass`, `options?`): `boolean`

Defined in: [modules/engine/src/models/light-model-utils.ts:158](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/light-model-utils.ts#L158)

Issue one draw call.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### renderPass[​](#renderpass-1 "Direct link to renderPass")

`RenderPass`

render pass to draw into

##### options?[​](#options "Direct link to options?")

[`ModelDrawOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ModelDrawOptions.md)

Optional dynamic parameters restored after drawing, including on errors.

#### Returns[​](#returns-17 "Direct link to Returns")

`boolean`

`true` if the draw call was executed, `false` if resources were not ready.

#### Inherited from[​](#inherited-from-50 "Direct link to Inherited from")

`BaseLightModel.draw`

***

### drawBatches()[​](#drawbatches "Direct link to drawBatches()")

> **drawBatches**<`Inputs`>(`renderPass`, `__namedParameters`): `boolean`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1082](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1082)

Draws each aligned physical chunk without taking ownership of input vectors. Each batch uses a separate aligned slot for managed shader-input uniforms set by `onBatch`. Slots are reused on each call: submit previous draws before changing their values or growing the allocation. Explicit buffers remain caller-managed. Vector lengths and physical chunk boundaries must match.

#### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

##### Inputs[​](#inputs "Direct link to Inputs")

`Inputs` *extends* [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md) = [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### renderPass[​](#renderpass-2 "Direct link to renderPass")

`RenderPass`

##### \_\_namedParameters[​](#__namedparameters "Direct link to __namedParameters")

[`GPUVectorModelDrawBatchesOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelDrawBatchesOptions.md)<`Inputs`>

#### Returns[​](#returns-18 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-51 "Direct link to Inherited from")

`BaseLightModel.drawBatches`

***

### getBindingDebugTable()[​](#getbindingdebugtable "Direct link to getBindingDebugTable()")

> **getBindingDebugTable**(): readonly `ShaderBindingDebugRow`\[]

Defined in: [modules/engine/src/model/gpu-vector-model.ts:662](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L662)

Returns WGSL binding debug rows for the assembled shader. Returns an empty array for GLSL models.

#### Returns[​](#returns-19 "Direct link to Returns")

readonly `ShaderBindingDebugRow`\[]

#### Inherited from[​](#inherited-from-52 "Direct link to Inherited from")

`BaseLightModel.getBindingDebugTable`

***

### needsRedraw()[​](#needsredraw "Direct link to needsRedraw()")

> **needsRedraw**(): `string` | `false`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:646](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L646)

Query redraw status. Clears the status.

#### Returns[​](#returns-20 "Direct link to Returns")

`string` | `false`

#### Inherited from[​](#inherited-from-53 "Direct link to Inherited from")

`BaseLightModel.needsRedraw`

***

### predraw()[​](#predraw "Direct link to predraw()")

> **predraw**(`commandEncoder`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:672](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L672)

Updates uniforms and pipeline state before opening a render pass.

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

Encoder that should own any GPU uploads emitted during draw preparation.

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-54 "Direct link to Inherited from")

`BaseLightModel.predraw`

***

### setAttributes()[​](#setattributes "Direct link to setAttributes()")

> **setAttributes**(`buffers`, `options?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1405](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1405)

Sets attributes (buffers)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### buffers[​](#buffers "Direct link to buffers")

`Record`<`string`, `ModelBuffer`>

##### options?[​](#options-1 "Direct link to options?")

###### byteOffsets?[​](#byteoffsets "Direct link to byteOffsets?")

`Record`<`string`, `number`>

Optional byte offsets, keyed by buffer name, where each buffer's vertex data starts. Buffers without an entry are bound at offset 0.

###### disableWarnings?[​](#disablewarnings "Direct link to disableWarnings?")

`boolean`

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

#### Note[​](#note-2 "Direct link to Note")

Overrides any attributes previously set with the same name

#### Inherited from[​](#inherited-from-55 "Direct link to Inherited from")

`BaseLightModel.setAttributes`

***

### setAttributeVectors()[​](#setattributevectors "Direct link to setAttributeVectors()")

> **setAttributeVectors**(`vectors`, `bufferLayouts?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:876](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L876)

Replaces supplemental vectors; instanced models default these inputs to instance step mode.

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### vectors[​](#vectors "Direct link to vectors")

[`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

##### bufferLayouts?[​](#bufferlayouts "Direct link to bufferLayouts?")

`BufferLayout`\[]

#### Returns[​](#returns-23 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-56 "Direct link to Inherited from")

`BaseLightModel.setAttributeVectors`

***

### setBindings()[​](#setbindings "Direct link to setBindings()")

> **setBindings**(`bindings`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1364](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1364)

Sets bindings (textures, samplers, uniform buffers)

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### bindings[​](#bindings-2 "Direct link to bindings")

`Record`<`string`, `ModelBinding`>

#### Returns[​](#returns-24 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-57 "Direct link to Inherited from")

`BaseLightModel.setBindings`

***

### setBufferLayout()[​](#setbufferlayout "Direct link to setBufferLayout()")

> **setBufferLayout**(`bufferLayout`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1210](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1210)

Updates the buffer layout.

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### bufferLayout[​](#bufferlayout-1 "Direct link to bufferLayout")

`BufferLayout`\[]

#### Returns[​](#returns-25 "Direct link to Returns")

`void`

#### Note[​](#note-3 "Direct link to Note")

Triggers a pipeline rebuild / pipeline cache fetch

#### Inherited from[​](#inherited-from-58 "Direct link to Inherited from")

`BaseLightModel.setBufferLayout`

***

### setConstantAttributes()[​](#setconstantattributes "Direct link to setConstantAttributes()")

> **setConstantAttributes**(`attributes`, `options?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1491](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1491)

Sets constant attributes

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### attributes[​](#attributes "Direct link to attributes")

`Record`<`string`, `TypedArray`>

##### options?[​](#options-2 "Direct link to options?")

###### disableWarnings?[​](#disablewarnings-1 "Direct link to disableWarnings?")

`boolean`

#### Returns[​](#returns-26 "Direct link to Returns")

`void`

#### Note[​](#note-4 "Direct link to Note")

Overrides any attributes previously set with the same name Constant attributes are only supported in WebGL, not in WebGPU Any attribute that is disabled in the current vertex array object is read from the context's global constant value for that attribute location.

#### Inherited from[​](#inherited-from-59 "Direct link to Inherited from")

`BaseLightModel.setConstantAttributes`

***

### setDrawOffsets()[​](#setdrawoffsets "Direct link to setDrawOffsets()")

> **setDrawOffsets**(`__namedParameters`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1321](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1321)

Updates the first indexed/non-indexed draw offsets.

#### Parameters[​](#parameters-15 "Direct link to Parameters")

##### \_\_namedParameters[​](#__namedparameters-1 "Direct link to __namedParameters")

###### firstIndex[​](#firstindex-1 "Direct link to firstIndex")

`number`

###### firstVertex[​](#firstvertex-1 "Direct link to firstVertex")

`number`

#### Returns[​](#returns-27 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-60 "Direct link to Inherited from")

`BaseLightModel.setDrawOffsets`

***

### setGeometry()[​](#setgeometry "Direct link to setGeometry()")

> **setGeometry**(`geometry`): `void`

Defined in: [modules/engine/src/model/model.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L90)

Adapts CPU and legacy buffer geometry into the GPU vector geometry API.

#### Parameters[​](#parameters-16 "Direct link to Parameters")

##### geometry[​](#geometry "Direct link to geometry")

`Geometry` | [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null`

#### Returns[​](#returns-28 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-61 "Direct link to Inherited from")

`BaseLightModel.setGeometry`

***

### setGeometryVectors()[​](#setgeometryvectors "Direct link to setGeometryVectors()")

> **setGeometryVectors**(`vectors`, `bufferLayouts?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:843](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L843)

Replaces per-vertex mesh vectors while preserving supplemental attributes.

#### Parameters[​](#parameters-17 "Direct link to Parameters")

##### vectors[​](#vectors-1 "Direct link to vectors")

[`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

##### bufferLayouts?[​](#bufferlayouts-1 "Direct link to bufferLayouts?")

`BufferLayout`\[]

#### Returns[​](#returns-29 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-62 "Direct link to Inherited from")

`BaseLightModel.setGeometryVectors`

***

### setGPUAttributes()[​](#setgpuattributes "Direct link to setGPUAttributes()")

> **setGPUAttributes**(`vectors`, `bufferLayouts`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:929](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L929)

Binds typed columns using caller-resolved layouts, including packed groups.

#### Parameters[​](#parameters-18 "Direct link to Parameters")

##### vectors[​](#vectors-2 "Direct link to vectors")

[`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

##### bufferLayouts[​](#bufferlayouts-2 "Direct link to bufferLayouts")

`BufferLayout`\[]

#### Returns[​](#returns-30 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-63 "Direct link to Inherited from")

`BaseLightModel.setGPUAttributes`

***

### setGPUVectors()[​](#setgpuvectors "Direct link to setGPUVectors()")

> **setGPUVectors**(`vectors`, `options?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1042](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1042)

Binds contiguous borrowed vectors; use drawBatches() for multi-chunk inputs.

#### Parameters[​](#parameters-19 "Direct link to Parameters")

##### vectors[​](#vectors-3 "Direct link to vectors")

[`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

##### options?[​](#options-3 "Direct link to options?")

###### count?[​](#count "Direct link to count?")

[`GPUVectorModelCount`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelCount.md)

#### Returns[​](#returns-31 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-64 "Direct link to Inherited from")

`BaseLightModel.setGPUVectors`

***

### setIndexBuffer()[​](#setindexbuffer "Direct link to setIndexBuffer()")

> **setIndexBuffer**(`indexBuffer`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1381](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1381)

Sets the index buffer

#### Parameters[​](#parameters-20 "Direct link to Parameters")

##### indexBuffer[​](#indexbuffer-1 "Direct link to indexBuffer")

`ModelBuffer` | `null`

#### Returns[​](#returns-32 "Direct link to Returns")

`void`

#### Todo[​](#todo-1 "Direct link to Todo")

* how to unset it if we change geometry?

#### Inherited from[​](#inherited-from-65 "Direct link to Inherited from")

`BaseLightModel.setIndexBuffer`

***

### setIndexCount()[​](#setindexcount "Direct link to setIndexCount()")

> **setIndexCount**(`indexCount`): `void`

Defined in: [modules/engine/src/model/model.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L104)

Updates the indexed draw count override.

#### Parameters[​](#parameters-21 "Direct link to Parameters")

##### indexCount[​](#indexcount-1 "Direct link to indexCount")

`number` | `undefined`

#### Returns[​](#returns-33 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-66 "Direct link to Inherited from")

`BaseLightModel.setIndexCount`

***

### setIndexVector()[​](#setindexvector "Direct link to setIndexVector()")

> **setIndexVector**(`vector`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:934](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L934)

Replaces the borrowed contiguous uint16/uint32 index vector.

#### Parameters[​](#parameters-22 "Direct link to Parameters")

##### vector[​](#vector "Direct link to vector")

[`GPUVectorModelInput`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInput.md) | `null`

#### Returns[​](#returns-34 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-67 "Direct link to Inherited from")

`BaseLightModel.setIndexVector`

***

### setInstanceCount()[​](#setinstancecount "Direct link to setInstanceCount()")

> **setInstanceCount**(`instanceCount`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1294](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1294)

Updates the instance count (used in draw calls)

#### Parameters[​](#parameters-23 "Direct link to Parameters")

##### instanceCount[​](#instancecount-1 "Direct link to instanceCount")

`number`

#### Returns[​](#returns-35 "Direct link to Returns")

`void`

#### Note[​](#note-5 "Direct link to Note")

Any attributes with stepMode=instance need to be at least this big

#### Inherited from[​](#inherited-from-68 "Direct link to Inherited from")

`BaseLightModel.setInstanceCount`

***

### setMaterial()[​](#setmaterial "Direct link to setMaterial()")

> **setMaterial**(`material`): `void`

Defined in: [modules/engine/src/model/model.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L109)

#### Parameters[​](#parameters-24 "Direct link to Parameters")

##### material[​](#material-2 "Direct link to material")

[`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)<`Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>, `MaterialBindings`> | `null`

#### Returns[​](#returns-36 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-69 "Direct link to Inherited from")

`BaseLightModel.setMaterial`

***

### setNeedsRedraw()[​](#setneedsredraw "Direct link to setNeedsRedraw()")

> **setNeedsRedraw**(`reason`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:657](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L657)

Mark the model as needing a redraw

#### Parameters[​](#parameters-25 "Direct link to Parameters")

##### reason[​](#reason-1 "Direct link to reason")

`string`

#### Returns[​](#returns-37 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-70 "Direct link to Inherited from")

`BaseLightModel.setNeedsRedraw`

***

### setParameters()[​](#setparameters "Direct link to setParameters()")

> **setParameters**(`parameters`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1277](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1277)

Set GPU parameters.

#### Parameters[​](#parameters-26 "Direct link to Parameters")

##### parameters[​](#parameters-27 "Direct link to parameters")

`RenderPipelineParameters`

#### Returns[​](#returns-38 "Direct link to Returns")

`void`

#### Note[​](#note-6 "Direct link to Note")

Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU. On WebGL, parameters are applied at each draw call, so the pipeline is kept.

#### Inherited from[​](#inherited-from-71 "Direct link to Inherited from")

`BaseLightModel.setParameters`

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `void`

Defined in: [modules/engine/src/models/light-model-utils.ts:165](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/light-model-utils.ts#L165)

#### Parameters[​](#parameters-28 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

`Partial`<`PropsT`>

#### Returns[​](#returns-39 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-72 "Direct link to Inherited from")

`BaseLightModel.setProps`

***

### setShaderInputs()[​](#setshaderinputs "Direct link to setShaderInputs()")

> **setShaderInputs**(`shaderInputs`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1328](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1328)

Set the shader inputs

#### Parameters[​](#parameters-29 "Direct link to Parameters")

##### shaderInputs[​](#shaderinputs-1 "Direct link to shaderInputs")

[`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

#### Returns[​](#returns-40 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-73 "Direct link to Inherited from")

`BaseLightModel.setShaderInputs`

***

### setTopology()[​](#settopology "Direct link to setTopology()")

> **setTopology**(`topology`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1199](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1199)

Updates the primitive topology ('triangle-list', 'triangle-strip' etc).

#### Parameters[​](#parameters-30 "Direct link to Parameters")

##### topology[​](#topology-1 "Direct link to topology")

`PrimitiveTopology`

#### Returns[​](#returns-41 "Direct link to Returns")

`void`

#### Note[​](#note-7 "Direct link to Note")

Triggers a pipeline rebuild / pipeline cache fetch on WebGPU

#### Inherited from[​](#inherited-from-74 "Direct link to Inherited from")

`BaseLightModel.setTopology`

***

### setTransformFeedback()[​](#settransformfeedback "Direct link to setTransformFeedback()")

> **setTransformFeedback**(`transformFeedback`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1372](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1372)

Updates optional transform feedback. WebGL only.

#### Parameters[​](#parameters-31 "Direct link to Parameters")

##### transformFeedback[​](#transformfeedback-1 "Direct link to transformFeedback")

`TransformFeedback` | `null`

#### Returns[​](#returns-42 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-75 "Direct link to Inherited from")

`BaseLightModel.setTransformFeedback`

***

### setVertexCount()[​](#setvertexcount "Direct link to setVertexCount()")

> **setVertexCount**(`vertexCount`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1308](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1308)

Updates the vertex count (used in draw calls)

#### Parameters[​](#parameters-32 "Direct link to Parameters")

##### vertexCount[​](#vertexcount-1 "Direct link to vertexCount")

`number`

#### Returns[​](#returns-43 "Direct link to Returns")

`void`

#### Note[​](#note-8 "Direct link to Note")

Any attributes with stepMode=vertex need to be at least this big

#### Inherited from[​](#inherited-from-76 "Direct link to Inherited from")

`BaseLightModel.setVertexCount`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:397](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L397)

#### Returns[​](#returns-44 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-77 "Direct link to Inherited from")

`BaseLightModel.toString`

***

### updateShaderInputs()[​](#updateshaderinputs "Direct link to updateShaderInputs()")

> **updateShaderInputs**(`commandEncoder?`): `void`

Defined in: [modules/engine/src/model/model.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L118)

Flushes current shader-input values into managed uniform buffers and resource bindings.

#### Parameters[​](#parameters-33 "Direct link to Parameters")

##### commandEncoder?[​](#commandencoder-1 "Direct link to commandEncoder?")

`CommandEncoder`

Optional encoder used to order uniform uploads with subsequent draw commands.

#### Returns[​](#returns-45 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-78 "Direct link to Inherited from")

`BaseLightModel.updateShaderInputs`

***

### createAsync()[​](#createasync "Direct link to createAsync()")

> `static` **createAsync**<`ModelType`, `Props`>(`this`, `device`, `props`): `Promise`<`ModelType`>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:218](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L218)

Creates a model while allowing the backend to compile its render pipeline asynchronously.

#### Type Parameters[​](#type-parameters-1 "Direct link to Type Parameters")

##### ModelType[​](#modeltype "Direct link to ModelType")

`ModelType` *extends* [`GPUVectorModel`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorModel.md)

##### Props[​](#props-2 "Direct link to Props")

`Props` = [`GPUVectorModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md)

#### Parameters[​](#parameters-34 "Direct link to Parameters")

##### this[​](#this "Direct link to this")

(`device`, `props`) => `ModelType`

##### device[​](#device-2 "Direct link to device")

`Device`

##### props[​](#props-3 "Direct link to props")

`Props`

#### Returns[​](#returns-46 "Direct link to Returns")

`Promise`<`ModelType`>

#### Inherited from[​](#inherited-from-79 "Direct link to Inherited from")

`BaseLightModel.createAsync`
