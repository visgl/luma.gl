# Class: BackgroundTextureModel

Defined in: [modules/engine/src/models/billboard-texture-model.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L88)

Model that renders a bitmap into the "background", i.e covering the screen

## Extends[​](#extends "Direct link to Extends")

* [`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new BackgroundTextureModel**(`device`, `props`): `BackgroundTextureModel`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L92)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`BackgroundTextureModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BackgroundTextureModelProps.md)

#### Returns[​](#returns "Direct link to Returns")

`BackgroundTextureModel`

#### Overrides[​](#overrides "Direct link to Overrides")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### \_attributeInfos[​](#_attributeinfos "Direct link to _attributeInfos")

> **\_attributeInfos**: `Record`<`string`, `AttributeInfo`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:341](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L341)

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_attributeInfos`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_attributeinfos)

***

### \_gpuGeometry[​](#_gpugeometry "Direct link to _gpuGeometry")

> **\_gpuGeometry**: [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null`

Defined in: [modules/engine/src/model/model.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L35)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_gpuGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_gpugeometry)

***

### \_lastDrawTimestamp[​](#_lastdrawtimestamp "Direct link to _lastDrawTimestamp")

> **\_lastDrawTimestamp**: `number` = `-1`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:368](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L368)

"Time" of last draw. Monotonically increasing timestamp

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_lastDrawTimestamp`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_lastdrawtimestamp)

***

### \_lastLogTime[​](#_lastlogtime "Direct link to _lastLogTime")

> **\_lastLogTime**: `number` = `0`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1641](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1641)

Throttle draw call logging

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_lastLogTime`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_lastlogtime)

***

### \_logOpen[​](#_logopen "Direct link to _logOpen")

> **\_logOpen**: `boolean` = `false`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1642](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1642)

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_logOpen`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_logopen)

***

### \_pipelineNeedsUpdate[​](#_pipelineneedsupdate "Direct link to _pipelineNeedsUpdate")

> **\_pipelineNeedsUpdate**: `string` | `false` = `'newly created'`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:361](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L361)

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_pipelineNeedsUpdate`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_pipelineneedsupdate)

***

### \_uniformStore[​](#_uniformstore "Direct link to _uniformStore")

> **\_uniformStore**: `UniformStore`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:339](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L339)

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_uniformStore`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_uniformstore)

***

### backgroundTexture[​](#backgroundtexture "Direct link to backgroundTexture")

> **backgroundTexture**: `Texture`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L89)

***

### bindings[​](#bindings "Direct link to bindings")

> **bindings**: `Record`<`string`, `ModelBinding`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:320](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L320)

Bindings (textures, samplers, uniform buffers)

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`bindings`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#bindings)

***

### bufferAttributes[​](#bufferattributes "Direct link to bufferAttributes")

> **bufferAttributes**: `Record`<`string`, `Buffer`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:316](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L316)

Buffer-valued attributes

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`bufferAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#bufferattributes)

***

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> **bufferLayout**: `BufferLayout`\[]

Defined in: [modules/engine/src/model/gpu-vector-model.ts:296](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L296)

Buffer layout

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`bufferLayout`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#bufferlayout)

***

### constantAttributes[​](#constantattributes "Direct link to constantAttributes")

> **constantAttributes**: `Record`<`string`, `TypedArray`> = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:318](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L318)

Constant-valued attributes

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`constantAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#constantattributes)

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:269](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L269)

Device that created this model

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`device`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#device)

***

### firstIndex[​](#firstindex "Direct link to firstIndex")

> **firstIndex**: `number`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:311](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L311)

First index element for WebGPU indexed draws.

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`firstIndex`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#firstindex)

***

### firstVertex[​](#firstvertex "Direct link to firstVertex")

> **firstVertex**: `number`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:309](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L309)

First vertex byte offset for WebGL indexed draws or first vertex for non-indexed draws.

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`firstVertex`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#firstvertex)

***

### flipY[​](#flipy "Direct link to flipY")

> **flipY**: `boolean` = `false`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L90)

***

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:280](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L280)

GLSL fragment shader source

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`fs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#fs)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:271](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L271)

Application provided identifier

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`id`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#id)

***

### indexBuffer[​](#indexbuffer "Direct link to indexBuffer")

> **indexBuffer**: `Buffer` | `null` = `null`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:314](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L314)

Index buffer

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`indexBuffer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#indexbuffer)

***

### indexCount[​](#indexcount "Direct link to indexCount")

> **indexCount**: `number` | `undefined`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:307](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L307)

Indexed draw count override. Undefined uses vertexCount, then the full bound index buffer.

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`indexCount`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#indexcount)

***

### instanceCount[​](#instancecount "Direct link to instanceCount")

> **instanceCount**: `number` = `0`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:303](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L303)

instance count. `undefined` means not instanced

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`instanceCount`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#instancecount)

***

### isInstanced[​](#isinstanced "Direct link to isInstanced")

> **isInstanced**: `boolean` | `undefined` = `undefined`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:301](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L301)

Use instanced rendering

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`isInstanced`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#isinstanced)

***

### material[​](#material "Direct link to material")

> **material**: [`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)<`Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>, `MaterialBindings`> | `null`

Defined in: [modules/engine/src/model/model.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L34)

#### Inherited from[​](#inherited-from-20 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#material)

***

### parameters[​](#parameters-1 "Direct link to parameters")

> **parameters**: `RenderPipelineParameters`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:291](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L291)

The render pipeline GPU parameters, depth testing etc

#### Inherited from[​](#inherited-from-21 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`parameters`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#parameters)

***

### pipeline[​](#pipeline "Direct link to pipeline")

> **pipeline**: `RenderPipeline`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:333](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L333)

The underlying GPU "program".

#### Note[​](#note "Direct link to Note")

May be recreated if parameters change

#### Inherited from[​](#inherited-from-22 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`pipeline`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#pipeline)

***

### pipelineFactory[​](#pipelinefactory "Direct link to pipelineFactory")

> `readonly` **pipelineFactory**: `PipelineFactory`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:282](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L282)

Factory used to create render pipelines

#### Inherited from[​](#inherited-from-23 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`pipelineFactory`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#pipelinefactory)

***

### shaderFactory[​](#shaderfactory "Direct link to shaderFactory")

> `readonly` **shaderFactory**: `ShaderFactory`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:284](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L284)

Factory used to create shaders

#### Inherited from[​](#inherited-from-24 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`shaderFactory`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#shaderfactory)

***

### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

> **shaderInputs**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/model/gpu-vector-model.ts:337](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L337)

ShaderInputs instance

#### Inherited from[​](#inherited-from-25 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`shaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#shaderinputs)

***

### source[​](#source "Direct link to source")

> `readonly` **source**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:274](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L274)

WGSL shader source when using unified shader

#### Inherited from[​](#inherited-from-26 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`source`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#source)

***

### topology[​](#topology "Direct link to topology")

> **topology**: `PrimitiveTopology`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:294](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L294)

The primitive topology

#### Inherited from[​](#inherited-from-27 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`topology`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#topology)

***

### transformFeedback[​](#transformfeedback "Direct link to transformFeedback")

> **transformFeedback**: `TransformFeedback` | `null` = `null`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:330](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L330)

TransformFeedback, WebGL 2 only.

#### Inherited from[​](#inherited-from-28 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`transformFeedback`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#transformfeedback)

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `object` = `{}`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:286](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L286)

User-supplied per-model data

#### Index Signature[​](#index-signature "Direct link to Index Signature")

\[`key`: `string`]: `unknown`

#### Inherited from[​](#inherited-from-29 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#userdata)

***

### vertexArray[​](#vertexarray "Direct link to vertexArray")

> **vertexArray**: `VertexArray`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:327](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L327)

VertexArray

#### Note[​](#note-1 "Direct link to Note")

not implemented: if bufferLayout is updated, vertex array has to be rebuilt!

#### Todo[​](#todo "Direct link to Todo")

* allow application to define multiple vertex arrays?

#### Inherited from[​](#inherited-from-30 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`vertexArray`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#vertexarray)

***

### vertexCount[​](#vertexcount "Direct link to vertexCount")

> **vertexCount**: `number`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:305](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L305)

Vertex count

#### Inherited from[​](#inherited-from-31 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`vertexCount`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#vertexcount)

***

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:277](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L277)

GLSL vertex shader source

#### Inherited from[​](#inherited-from-32 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`vs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#vs)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`GPUVectorModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md)> & `object`

Defined in: [modules/engine/src/model/model.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L29)

#### Type Declaration[​](#type-declaration "Direct link to Type Declaration")

##### material[​](#material-1 "Direct link to material")

> **material**: [`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)

#### Inherited from[​](#inherited-from-33 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:372](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L372)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-34 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`[toStringTag]`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#tostringtag)

***

### sourceGeometry[​](#sourcegeometry "Direct link to sourceGeometry")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **sourceGeometry**(): `Geometry` | [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null` | `undefined`

Defined in: [modules/engine/src/model/model.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L40)

Borrowed source geometry, retained for scene adapters such as physics cooking.

##### Returns[​](#returns-2 "Direct link to Returns")

`Geometry` | [`GPUVectorGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorGeometry.md) | [`GPUGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md) | `null` | `undefined`

#### Inherited from[​](#inherited-from-35 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`sourceGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#sourcegeometry)

## Methods[​](#methods "Direct link to Methods")

### \_areBindingsLoading()[​](#_arebindingsloading "Direct link to _areBindingsLoading()")

> **\_areBindingsLoading**(): `string` | `false`

Defined in: [modules/engine/src/model/model.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L132)

Check that bindings are loaded. Returns id of first binding that is still loading.

#### Returns[​](#returns-3 "Direct link to Returns")

`string` | `false`

#### Inherited from[​](#inherited-from-36 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_areBindingsLoading`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_arebindingsloading)

***

### \_getAttributeDebugTable()[​](#_getattributedebugtable "Direct link to _getAttributeDebugTable()")

> **\_getAttributeDebugTable**(): `Record`<`string`, `Record`<`string`, `unknown`>>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1693](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1693)

#### Returns[​](#returns-4 "Direct link to Returns")

`Record`<`string`, `Record`<`string`, `unknown`>>

#### Inherited from[​](#inherited-from-37 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_getAttributeDebugTable`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_getattributedebugtable)

***

### \_getBindGroupCacheKeys()[​](#_getbindgroupcachekeys "Direct link to _getBindGroupCacheKeys()")

> **\_getBindGroupCacheKeys**(): `Partial`<`Record`<`number`, `object`>>

Defined in: [modules/engine/src/model/model.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L155)

#### Returns[​](#returns-5 "Direct link to Returns")

`Partial`<`Record`<`number`, `object`>>

#### Inherited from[​](#inherited-from-38 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_getBindGroupCacheKeys`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_getbindgroupcachekeys)

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

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_getBindGroups`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_getbindgroups)

***

### \_getBindings()[​](#_getbindings "Direct link to _getBindings()")

> **\_getBindings**(`shaderLayout?`): `Record`<`string`, `Binding`>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1448](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1448)

Resolves ready model bindings for the current shader layout.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### shaderLayout?[​](#shaderlayout-1 "Direct link to shaderLayout?")

`AnyShaderLayout` = `...`

Reflected bindings used to select copied or external texture resolution.

#### Returns[​](#returns-7 "Direct link to Returns")

`Record`<`string`, `Binding`>

#### Inherited from[​](#inherited-from-40 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_getBindings`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_getbindings)

***

### \_getBindingsUpdateTimestamp()[​](#_getbindingsupdatetimestamp "Direct link to _getBindingsUpdateTimestamp()")

> **\_getBindingsUpdateTimestamp**(): `number`

Defined in: [modules/engine/src/model/model.ts:160](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L160)

Get the timestamp of the latest updated bound GPU memory resource (buffer/texture).

#### Returns[​](#returns-8 "Direct link to Returns")

`number`

#### Inherited from[​](#inherited-from-41 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_getBindingsUpdateTimestamp`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_getbindingsupdatetimestamp)

***

### \_getBufferOrConstantValues()[​](#_getbufferorconstantvalues "Direct link to _getBufferOrConstantValues()")

> **\_getBufferOrConstantValues**(`attribute`, `dataType`): `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1721](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1721)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### attribute[​](#attribute "Direct link to attribute")

`TypedArray` | `Buffer`

##### dataType[​](#datatype "Direct link to dataType")

`any`

#### Returns[​](#returns-9 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-42 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_getBufferOrConstantValues`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_getbufferorconstantvalues)

***

### \_logDrawCallEnd()[​](#_logdrawcallend "Direct link to _logDrawCallEnd()")

> **\_logDrawCallEnd**(): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1657](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1657)

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-43 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_logDrawCallEnd`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_logdrawcallend)

***

### \_logDrawCallStart()[​](#_logdrawcallstart "Direct link to _logDrawCallStart()")

> **\_logDrawCallStart**(): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1644](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1644)

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-44 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_logDrawCallStart`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_logdrawcallstart)

***

### \_logFramebuffer()[​](#_logframebuffer "Direct link to _logFramebuffer()")

> **\_logFramebuffer**(`renderPass`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1678](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1678)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### renderPass[​](#renderpass "Direct link to renderPass")

`RenderPass`

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-45 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_logFramebuffer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_logframebuffer)

***

### \_setPipelineNeedsUpdate()[​](#_setpipelineneedsupdate "Direct link to _setPipelineNeedsUpdate()")

> **\_setPipelineNeedsUpdate**(`reason`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1519](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1519)

Mark pipeline as needing update

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### reason[​](#reason "Direct link to reason")

`string`

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-46 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_setPipelineNeedsUpdate`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_setpipelineneedsupdate)

***

### \_updatePipeline()[​](#_updatepipeline "Direct link to _updatePipeline()")

> **\_updatePipeline**(): `RenderPipeline`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1526](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1526)

Update pipeline if needed

#### Returns[​](#returns-14 "Direct link to Returns")

`RenderPipeline`

#### Inherited from[​](#inherited-from-47 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_updatePipeline`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_updatepipeline)

***

### \_updatePipelineAsync()[​](#_updatepipelineasync "Direct link to _updatePipelineAsync()")

> **\_updatePipelineAsync**(): `Promise`<`RenderPipeline`>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1542](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1542)

Creates or replaces the render pipeline through the backend's asynchronous compilation path.

#### Returns[​](#returns-15 "Direct link to Returns")

`Promise`<`RenderPipeline`>

#### Inherited from[​](#inherited-from-48 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`_updatePipelineAsync`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#_updatepipelineasync)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/model/model.ts:82](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L82)

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-49 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#destroy)

***

### draw()[​](#draw "Direct link to draw()")

> **draw**(`renderPass`): `boolean`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:664](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L664)

Issue one draw call.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### renderPass[​](#renderpass-1 "Direct link to renderPass")

`RenderPass`

render pass to draw into

#### Returns[​](#returns-17 "Direct link to Returns")

`boolean`

`true` if the draw call was executed, `false` if resources were not ready.

#### Inherited from[​](#inherited-from-50 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`draw`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#draw)

***

### drawBatches()[​](#drawbatches "Direct link to drawBatches()")

> **drawBatches**<`Inputs`>(`renderPass`, `__namedParameters`): `boolean`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1022](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1022)

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

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`drawBatches`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#drawbatches)

***

### getBindingDebugTable()[​](#getbindingdebugtable "Direct link to getBindingDebugTable()")

> **getBindingDebugTable**(): readonly `ShaderBindingDebugRow`\[]

Defined in: [modules/engine/src/model/gpu-vector-model.ts:641](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L641)

Returns WGSL binding debug rows for the assembled shader. Returns an empty array for GLSL models.

#### Returns[​](#returns-19 "Direct link to Returns")

readonly `ShaderBindingDebugRow`\[]

#### Inherited from[​](#inherited-from-52 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`getBindingDebugTable`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#getbindingdebugtable)

***

### needsRedraw()[​](#needsredraw "Direct link to needsRedraw()")

> **needsRedraw**(): `string` | `false`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:625](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L625)

Query redraw status. Clears the status.

#### Returns[​](#returns-20 "Direct link to Returns")

`string` | `false`

#### Inherited from[​](#inherited-from-53 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`needsRedraw`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#needsredraw)

***

### predraw()[​](#predraw "Direct link to predraw()")

> **predraw**(`commandEncoder`): `void`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L151)

Updates uniforms and pipeline state before opening a render pass.

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

Encoder that should own any GPU uploads emitted during draw preparation.

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`predraw`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#predraw)

***

### setAttributes()[​](#setattributes "Direct link to setAttributes()")

> **setAttributes**(`buffers`, `options?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1329](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1329)

Sets attributes (buffers)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### buffers[​](#buffers "Direct link to buffers")

`Record`<`string`, `ModelBuffer`>

##### options?[​](#options "Direct link to options?")

###### byteOffsets?[​](#byteoffsets "Direct link to byteOffsets?")

`Record`<`string`, `number`>

Optional byte offsets, keyed by buffer name, where each buffer's vertex data starts. Buffers without an entry are bound at offset 0.

###### disableWarnings?[​](#disablewarnings "Direct link to disableWarnings?")

`boolean`

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

#### Note[​](#note-2 "Direct link to Note")

Overrides any attributes previously set with the same name

#### Inherited from[​](#inherited-from-54 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setattributes)

***

### setAttributeVectors()[​](#setattributevectors "Direct link to setAttributeVectors()")

> **setAttributeVectors**(`vectors`, `bufferLayouts?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:822](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L822)

Replaces supplemental vectors; instanced models default these inputs to instance step mode.

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### vectors[​](#vectors "Direct link to vectors")

[`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

##### bufferLayouts?[​](#bufferlayouts "Direct link to bufferLayouts?")

`BufferLayout`\[]

#### Returns[​](#returns-23 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-55 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setAttributeVectors`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setattributevectors)

***

### setBindings()[​](#setbindings "Direct link to setBindings()")

> **setBindings**(`bindings`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1288](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1288)

Sets bindings (textures, samplers, uniform buffers)

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### bindings[​](#bindings-2 "Direct link to bindings")

`Record`<`string`, `ModelBinding`>

#### Returns[​](#returns-24 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-56 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setBindings`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setbindings)

***

### setBufferLayout()[​](#setbufferlayout "Direct link to setBufferLayout()")

> **setBufferLayout**(`bufferLayout`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1143](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1143)

Updates the buffer layout.

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### bufferLayout[​](#bufferlayout-1 "Direct link to bufferLayout")

`BufferLayout`\[]

#### Returns[​](#returns-25 "Direct link to Returns")

`void`

#### Note[​](#note-3 "Direct link to Note")

Triggers a pipeline rebuild / pipeline cache fetch

#### Inherited from[​](#inherited-from-57 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setBufferLayout`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setbufferlayout)

***

### setConstantAttributes()[​](#setconstantattributes "Direct link to setConstantAttributes()")

> **setConstantAttributes**(`attributes`, `options?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1415](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1415)

Sets constant attributes

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### attributes[​](#attributes "Direct link to attributes")

`Record`<`string`, `TypedArray`>

##### options?[​](#options-1 "Direct link to options?")

###### disableWarnings?[​](#disablewarnings-1 "Direct link to disableWarnings?")

`boolean`

#### Returns[​](#returns-26 "Direct link to Returns")

`void`

#### Note[​](#note-4 "Direct link to Note")

Overrides any attributes previously set with the same name Constant attributes are only supported in WebGL, not in WebGPU Any attribute that is disabled in the current vertex array object is read from the context's global constant value for that attribute location.

#### Inherited from[​](#inherited-from-58 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setConstantAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setconstantattributes)

***

### setDrawOffsets()[​](#setdrawoffsets "Direct link to setDrawOffsets()")

> **setDrawOffsets**(`__namedParameters`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1245](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1245)

Updates the first indexed/non-indexed draw offsets.

#### Parameters[​](#parameters-15 "Direct link to Parameters")

##### \_\_namedParameters[​](#__namedparameters-1 "Direct link to __namedParameters")

###### firstIndex[​](#firstindex-1 "Direct link to firstIndex")

`number`

###### firstVertex[​](#firstvertex-1 "Direct link to firstVertex")

`number`

#### Returns[​](#returns-27 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-59 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setDrawOffsets`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setdrawoffsets)

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

#### Inherited from[​](#inherited-from-60 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setGeometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setgeometry)

***

### setGeometryVectors()[​](#setgeometryvectors "Direct link to setGeometryVectors()")

> **setGeometryVectors**(`vectors`, `bufferLayouts?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:799](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L799)

Replaces per-vertex mesh vectors while preserving supplemental attributes.

#### Parameters[​](#parameters-17 "Direct link to Parameters")

##### vectors[​](#vectors-1 "Direct link to vectors")

[`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

##### bufferLayouts?[​](#bufferlayouts-1 "Direct link to bufferLayouts?")

`BufferLayout`\[]

#### Returns[​](#returns-29 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-61 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setGeometryVectors`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setgeometryvectors)

***

### setGPUAttributes()[​](#setgpuattributes "Direct link to setGPUAttributes()")

> **setGPUAttributes**(`vectors`, `bufferLayouts`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:870](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L870)

Binds typed columns using caller-resolved layouts, including packed groups.

#### Parameters[​](#parameters-18 "Direct link to Parameters")

##### vectors[​](#vectors-2 "Direct link to vectors")

[`GPUVectorModelAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelAttributes.md)

##### bufferLayouts[​](#bufferlayouts-2 "Direct link to bufferLayouts")

`BufferLayout`\[]

#### Returns[​](#returns-30 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-62 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setGPUAttributes`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setgpuattributes)

***

### setGPUVectors()[​](#setgpuvectors "Direct link to setGPUVectors()")

> **setGPUVectors**(`vectors`, `options?`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:983](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L983)

Binds contiguous borrowed vectors; use drawBatches() for multi-chunk inputs.

#### Parameters[​](#parameters-19 "Direct link to Parameters")

##### vectors[​](#vectors-3 "Direct link to vectors")

[`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

##### options?[​](#options-2 "Direct link to options?")

###### count?[​](#count "Direct link to count?")

[`GPUVectorModelCount`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelCount.md)

#### Returns[​](#returns-31 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-63 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setGPUVectors`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setgpuvectors)

***

### setIndexBuffer()[​](#setindexbuffer "Direct link to setIndexBuffer()")

> **setIndexBuffer**(`indexBuffer`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1305](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1305)

Sets the index buffer

#### Parameters[​](#parameters-20 "Direct link to Parameters")

##### indexBuffer[​](#indexbuffer-1 "Direct link to indexBuffer")

`ModelBuffer` | `null`

#### Returns[​](#returns-32 "Direct link to Returns")

`void`

#### Todo[​](#todo-1 "Direct link to Todo")

* how to unset it if we change geometry?

#### Inherited from[​](#inherited-from-64 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setIndexBuffer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setindexbuffer)

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

#### Inherited from[​](#inherited-from-65 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setIndexCount`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setindexcount)

***

### setIndexVector()[​](#setindexvector "Direct link to setIndexVector()")

> **setIndexVector**(`vector`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:875](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L875)

Replaces the borrowed contiguous uint16/uint32 index vector.

#### Parameters[​](#parameters-22 "Direct link to Parameters")

##### vector[​](#vector "Direct link to vector")

[`GPUVectorModelInput`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInput.md) | `null`

#### Returns[​](#returns-34 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-66 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setIndexVector`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setindexvector)

***

### setInstanceCount()[​](#setinstancecount "Direct link to setInstanceCount()")

> **setInstanceCount**(`instanceCount`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1218](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1218)

Updates the instance count (used in draw calls)

#### Parameters[​](#parameters-23 "Direct link to Parameters")

##### instanceCount[​](#instancecount-1 "Direct link to instanceCount")

`number`

#### Returns[​](#returns-35 "Direct link to Returns")

`void`

#### Note[​](#note-5 "Direct link to Note")

Any attributes with stepMode=instance need to be at least this big

#### Inherited from[​](#inherited-from-67 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setInstanceCount`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setinstancecount)

***

### setMaterial()[​](#setmaterial "Direct link to setMaterial()")

> **setMaterial**(`material`): `void`

Defined in: [modules/engine/src/model/model.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L109)

#### Parameters[​](#parameters-24 "Direct link to Parameters")

##### material[​](#material-2 "Direct link to material")

[`Material`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Material.md)<`Partial`<`Record`<`string`, `Record`<`string`, `unknown`>>>, `MaterialBindings`> | `null`

#### Returns[​](#returns-36 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-68 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setMaterial`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setmaterial)

***

### setNeedsRedraw()[​](#setneedsredraw "Direct link to setNeedsRedraw()")

> **setNeedsRedraw**(`reason`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:636](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L636)

Mark the model as needing a redraw

#### Parameters[​](#parameters-25 "Direct link to Parameters")

##### reason[​](#reason-1 "Direct link to reason")

`string`

#### Returns[​](#returns-37 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-69 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setNeedsRedraw`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setneedsredraw)

***

### setParameters()[​](#setparameters "Direct link to setParameters()")

> **setParameters**(`parameters`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1201](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1201)

Set GPU parameters.

#### Parameters[​](#parameters-26 "Direct link to Parameters")

##### parameters[​](#parameters-27 "Direct link to parameters")

`RenderPipelineParameters`

#### Returns[​](#returns-38 "Direct link to Returns")

`void`

#### Note[​](#note-6 "Direct link to Note")

Can trigger a pipeline rebuild / pipeline cache fetch on WebGPU. On WebGL, parameters are applied at each draw call, so the pipeline is kept.

#### Inherited from[​](#inherited-from-70 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setParameters`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setparameters)

***

### setProps()[​](#setprops "Direct link to setProps()")

> **setProps**(`props`): `void`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L123)

Update the background texture

#### Parameters[​](#parameters-28 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

`Partial`<[`BackgroundTextureModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BackgroundTextureModelProps.md)>

#### Returns[​](#returns-39 "Direct link to Returns")

`void`

***

### setShaderInputs()[​](#setshaderinputs "Direct link to setShaderInputs()")

> **setShaderInputs**(`shaderInputs`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1252](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1252)

Set the shader inputs

#### Parameters[​](#parameters-29 "Direct link to Parameters")

##### shaderInputs[​](#shaderinputs-1 "Direct link to shaderInputs")

[`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

#### Returns[​](#returns-40 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-71 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setshaderinputs)

***

### setTopology()[​](#settopology "Direct link to setTopology()")

> **setTopology**(`topology`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1132](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1132)

Updates the primitive topology ('triangle-list', 'triangle-strip' etc).

#### Parameters[​](#parameters-30 "Direct link to Parameters")

##### topology[​](#topology-1 "Direct link to topology")

`PrimitiveTopology`

#### Returns[​](#returns-41 "Direct link to Returns")

`void`

#### Note[​](#note-7 "Direct link to Note")

Triggers a pipeline rebuild / pipeline cache fetch on WebGPU

#### Inherited from[​](#inherited-from-72 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setTopology`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#settopology)

***

### setTransformFeedback()[​](#settransformfeedback "Direct link to setTransformFeedback()")

> **setTransformFeedback**(`transformFeedback`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1296](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1296)

Updates optional transform feedback. WebGL only.

#### Parameters[​](#parameters-31 "Direct link to Parameters")

##### transformFeedback[​](#transformfeedback-1 "Direct link to transformFeedback")

`TransformFeedback` | `null`

#### Returns[​](#returns-42 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-73 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setTransformFeedback`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#settransformfeedback)

***

### setVertexCount()[​](#setvertexcount "Direct link to setVertexCount()")

> **setVertexCount**(`vertexCount`): `void`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:1232](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L1232)

Updates the vertex count (used in draw calls)

#### Parameters[​](#parameters-32 "Direct link to Parameters")

##### vertexCount[​](#vertexcount-1 "Direct link to vertexCount")

`number`

#### Returns[​](#returns-43 "Direct link to Returns")

`void`

#### Note[​](#note-8 "Direct link to Note")

Any attributes with stepMode=vertex need to be at least this big

#### Inherited from[​](#inherited-from-74 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`setVertexCount`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#setvertexcount)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/engine/src/model/gpu-vector-model.ts:376](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L376)

#### Returns[​](#returns-44 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-75 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#tostring)

***

### updateScale()[​](#updatescale "Direct link to updateScale()")

> **updateScale**(`texture`): `void`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:156](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L156)

#### Parameters[​](#parameters-33 "Direct link to Parameters")

##### texture[​](#texture "Direct link to texture")

`Texture`

#### Returns[​](#returns-45 "Direct link to Returns")

`void`

***

### updateShaderInputs()[​](#updateshaderinputs "Direct link to updateShaderInputs()")

> **updateShaderInputs**(`commandEncoder?`): `void`

Defined in: [modules/engine/src/model/model.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/model.ts#L118)

Flushes current shader-input values into managed uniform buffers and resource bindings.

#### Parameters[​](#parameters-34 "Direct link to Parameters")

##### commandEncoder?[​](#commandencoder-1 "Direct link to commandEncoder?")

`CommandEncoder`

Optional encoder used to order uniform uploads with subsequent draw commands.

#### Returns[​](#returns-46 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-76 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`updateShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#updateshaderinputs)

***

### createAsync()[​](#createasync "Direct link to createAsync()")

> `static` **createAsync**<`ModelType`, `Props`>(`this`, `device`, `props`): `Promise`<`ModelType`>

Defined in: [modules/engine/src/model/gpu-vector-model.ts:198](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model.ts#L198)

Creates a model while allowing the backend to compile its render pipeline asynchronously.

#### Type Parameters[​](#type-parameters-1 "Direct link to Type Parameters")

##### ModelType[​](#modeltype "Direct link to ModelType")

`ModelType` *extends* [`GPUVectorModel`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorModel.md)

##### Props[​](#props-2 "Direct link to Props")

`Props` = [`GPUVectorModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md)

#### Parameters[​](#parameters-35 "Direct link to Parameters")

##### this[​](#this "Direct link to this")

(`device`, `props`) => `ModelType`

##### device[​](#device-2 "Direct link to device")

`Device`

##### props[​](#props-3 "Direct link to props")

`Props`

#### Returns[​](#returns-47 "Direct link to Returns")

`Promise`<`ModelType`>

#### Inherited from[​](#inherited-from-77 "Direct link to Inherited from")

[`ClipSpace`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md).[`createAsync`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ClipSpace.md#createasync)
