# Abstract Class: RenderPipeline

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L74)

A compiled and linked shader program

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`RenderPipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new RenderPipeline**(`device`, `props`): `RenderPipeline`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L111)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns "Direct link to Returns")

`RenderPipeline`

#### Overrides[​](#overrides "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`constructor`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> `readonly` **bufferLayout**: [`BufferLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BufferLayout.md)\[]

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L85)

Buffer map describing buffer interleaving etc

***

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean` = `false`

Defined in: [modules/core/src/adapter/resources/resource.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L131)

Whether this resource has been destroyed

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyed`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyed)

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/adapter/resources/resource.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L124)

The device that this resource is associated with

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`device`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#device)

***

### fs[​](#fs "Direct link to fs")

> `abstract` `readonly` **fs**: [`Shader`](https://luma.gl/docs/api-reference/generated/core/classes/Shader.md) | `null`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L80)

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L126)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`handle`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#handle)

***

### hash[​](#hash "Direct link to hash")

> **hash**: `string` = `''`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L89)

The hash of the pipeline

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L118)

props.id, for debugging.

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`id`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#id)

***

### linkStatus[​](#linkstatus "Direct link to linkStatus")

> **linkStatus**: `"error"` | `"pending"` | `"success"` = `'pending'`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L87)

The linking status of the pipeline. 'pending' if linking is asynchronous, and on production

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L120)

The props that this resource was created with

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`props`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#props-1)

***

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

> **shaderLayout**: [`ShaderLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L83)

The merged layout

***

### sharedRenderPipeline[​](#sharedrenderpipeline "Direct link to sharedRenderPipeline")

> **sharedRenderPipeline**: [`SharedRenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/SharedRenderPipeline.md) | `null` = `null`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L91)

Optional shared backend implementation

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/adapter/resources/resource.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L122)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`userData`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#userdata)

***

### vs[​](#vs "Direct link to vs")

> `abstract` `readonly` **vs**: [`Shader`](https://luma.gl/docs/api-reference/generated/core/classes/Shader.md)

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L79)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`RenderPipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)>

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:158](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L158)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`defaultProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L75)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`[toStringTag]`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostringtag)

***

### isErrored[​](#iserrored "Direct link to isErrored")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isErrored**(): `boolean`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L103)

Whether shader or pipeline compilation/linking has failed

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L147)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`isHandleBorrowed`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#ishandleborrowed)

***

### isPending[​](#ispending "Direct link to isPending")

#### Get Signature[​](#get-signature-3 "Direct link to Get Signature")

> **get** **isPending**(): `boolean`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L94)

Whether shader or pipeline compilation/linking is still in progress

##### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-4 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L140)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-5 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`ownsHandle`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#ownshandle)

## Methods[​](#methods "Direct link to Methods")

### attachResource()[​](#attachresource "Direct link to attachResource()")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L200)

Attaches a resource. Attached resources are auto destroyed when this resource is destroyed Called automatically when sub resources are auto created but can be called by application

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`attachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#attachresource)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-7 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use destroy()

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`delete`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L173)

destroy can be called on any resource to release it before it is garbage collected.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroy`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroy)

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResources`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresources)

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### ~~draw()~~[​](#draw "Direct link to draw")

> `abstract` **draw**(`options`): `boolean`

Defined in: [modules/core/src/adapter/resources/render-pipeline.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pipeline.ts#L122)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options[​](#options "Direct link to options")

###### \_bindGroupCacheKeys?[​](#_bindgroupcachekeys "Direct link to _bindGroupCacheKeys?")

`Partial`<`Record`<`number`, `object`>>

Optional stable cache keys for backend bind-group reuse

###### baseVertex?[​](#basevertex "Direct link to baseVertex?")

`number`

###### bindGroups?[​](#bindgroups "Direct link to bindGroups?")

`Partial`<`Record`<`number`, [`Bindings`](https://luma.gl/docs/api-reference/generated/core/type-aliases/Bindings.md)>>

**Deprecated**

Set bindings on RenderPass instead.

###### bindings?[​](#bindings "Direct link to bindings?")

[`Bindings`](https://luma.gl/docs/api-reference/generated/core/type-aliases/Bindings.md)

**Deprecated**

Set bindings on RenderPass instead.

###### firstIndex?[​](#firstindex "Direct link to firstIndex?")

`number`

First index to draw from

###### firstInstance?[​](#firstinstance "Direct link to firstInstance?")

`number`

First instance to draw from

###### firstVertex?[​](#firstvertex "Direct link to firstVertex?")

`number`

First vertex to draw from

###### indexCount?[​](#indexcount "Direct link to indexCount?")

`number`

Number of "rows" in index buffer

###### instanceCount?[​](#instancecount "Direct link to instanceCount?")

`number`

Number of "rows" in 'instance' buffers

###### isInstanced?[​](#isinstanced "Direct link to isInstanced?")

`boolean`

Use instanced rendering?

###### parameters?[​](#parameters-5 "Direct link to parameters?")

[`RenderPipelineParameters`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineParameters.md)

Parameters to be set during draw call. Note that most parameters can only be overridden in WebGL.

###### renderPass?[​](#renderpass "Direct link to renderPass?")

[`RenderPass`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPass.md)

Render pass to draw into (targeting screen or framebuffer)

###### topology?[​](#topology "Direct link to topology?")

[`PrimitiveTopology`](https://luma.gl/docs/api-reference/generated/core/type-aliases/PrimitiveTopology.md)

Topology. Note can only be overridden in WebGL.

###### transformFeedback?[​](#transformfeedback "Direct link to transformFeedback?")

[`TransformFeedback`](https://luma.gl/docs/api-reference/generated/core/classes/TransformFeedback.md)

Transform feedback. WebGL only.

###### uniforms?[​](#uniforms "Direct link to uniforms?")

`Record`<`string`, `unknown`>

WebGL-only uniforms

###### vertexArray[​](#vertexarray "Direct link to vertexArray")

[`VertexArray`](https://luma.gl/docs/api-reference/generated/core/classes/VertexArray.md)

vertex attributes

###### vertexCount?[​](#vertexcount "Direct link to vertexCount?")

`number`

Number of "rows" in 'vertex' buffers

#### Returns[​](#returns-12 "Direct link to Returns")

`boolean`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use RenderPass.setPipeline(), setBindings(), setVertexArray(), and draw(). Will be removed in the next major release.

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-13 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`getProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#getprops)

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-14 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toJSON`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-15 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toString`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostring)
