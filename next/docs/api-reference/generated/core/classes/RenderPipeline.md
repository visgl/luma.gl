# Abstract Class: RenderPipeline

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:117](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L117)

A compiled and linked shader program

## Extends[​](#extends "Direct link to Extends")

* [`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md)<[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new RenderPipeline**(`device`, `props`): `RenderPipeline`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:154](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L154)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns "Direct link to Returns")

`RenderPipeline`

#### Overrides[​](#overrides "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> `readonly` **bufferLayout**: [`BufferLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferLayout.md)\[]

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L128)

Buffer map describing buffer interleaving etc

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L127)

The device that this resource is associated with

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`device`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#device)

***

### fs[​](#fs "Direct link to fs")

> `abstract` `readonly` **fs**: [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md) | `null`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L123)

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L129)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`handle`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#handle)

***

### hash[​](#hash "Direct link to hash")

> **hash**: `string` = `''`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L132)

The hash of the pipeline

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:121](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L121)

props.id, for debugging.

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`id`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#id)

***

### linkStatus[​](#linkstatus "Direct link to linkStatus")

> **linkStatus**: `"error"` | `"pending"` | `"success"` = `'pending'`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L130)

The linking status of the pipeline. 'pending' if linking is asynchronous, and on production

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L123)

The props that this resource was created with

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`props`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#props-1)

***

### shaderLayout[​](#shaderlayout "Direct link to shaderLayout")

> **shaderLayout**: [`ShaderLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L126)

The merged layout

***

### sharedRenderPipeline[​](#sharedrenderpipeline "Direct link to sharedRenderPipeline")

> **sharedRenderPipeline**: [`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md) | `null` = `null`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L134)

Optional shared backend implementation

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L125)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#userdata)

***

### vs[​](#vs "Direct link to vs")

> `abstract` `readonly` **vs**: [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L122)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)>

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:201](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L201)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L118)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`[toStringTag]`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#tostringtag)

***

### destroyed[​](#destroyed "Direct link to destroyed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **destroyed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L26)

Whether destruction has completed, including when cleanup reported an error.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroyed`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroyed)

***

### isErrored[​](#iserrored "Direct link to isErrored")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **isErrored**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L146)

Whether shader or pipeline compilation/linking has failed

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-3 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L146)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`isHandleBorrowed`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#ishandleborrowed)

***

### isPending[​](#ispending "Direct link to isPending")

#### Get Signature[​](#get-signature-4 "Direct link to Get Signature")

> **get** **isPending**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L137)

Whether shader or pipeline compilation/linking is still in progress

##### Returns[​](#returns-5 "Direct link to Returns")

`boolean`

***

### ownedResources[​](#ownedresources "Direct link to ownedResources")

#### Get Signature[​](#get-signature-5 "Direct link to Get Signature")

> **get** **ownedResources**(): readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

Defined in: [modules/core/src/api/adapter/resources/resource.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L21)

A snapshot of this resource's children. Mutating the snapshot cannot change ownership.

##### Returns[​](#returns-6 "Direct link to Returns")

readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`ownedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#ownedresources)

***

### owner[​](#owner "Direct link to owner")

#### Get Signature[​](#get-signature-6 "Direct link to Get Signature")

> **get** **owner**(): [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L16)

The resource responsible for destroying this resource, or null for caller-managed lifetime.

##### Returns[​](#returns-7 "Direct link to Returns")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`owner`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#owner)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-7 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L139)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-8 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`ownsHandle`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#ownshandle)

## Methods[​](#methods "Direct link to Methods")

### ~~attachResource()~~[​](#attachresource "Direct link to attachresource")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L90)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use resource.transferOwnershipTo(this).

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`attachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#attachresource)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L84)

#### Returns[​](#returns-10 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use destroy().

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`delete`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L49)

Destroy children before this resource. Subclasses implement hooks instead of overriding.

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroy)

***

### ~~destroyAttachedResource()~~[​](#destroyattachedresource "Direct link to destroyattachedresource")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L102)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

Check resource.owner and call resource.destroy().

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroyAttachedResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroyattachedresource)

***

### ~~destroyAttachedResources()~~[​](#destroyattachedresources "Direct link to destroyattachedresources")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L109)

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Destroy individually owned resources, or destroy the owner.

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroyAttachedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroyattachedresources)

***

### ~~detachResource()~~[​](#detachresource "Direct link to detachresource")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L95)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-4 "Direct link to Deprecated")

Use resource.transferOwnershipTo(null). Only detaches a child owned by this.

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`detachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#detachresource)

***

### ~~draw()~~[​](#draw "Direct link to draw")

> `abstract` **draw**(`options`): `boolean`

Defined in: [modules/core/src/api/adapter/resources/render-pipeline.ts:165](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/render-pipeline.ts#L165)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options[​](#options "Direct link to options")

###### \_bindGroupCacheKeys?[​](#_bindgroupcachekeys "Direct link to _bindGroupCacheKeys?")

`Partial`<`Record`<`number`, `object`>>

Optional stable cache keys for backend bind-group reuse

###### baseVertex?[​](#basevertex "Direct link to baseVertex?")

`number`

###### bindGroups?[​](#bindgroups "Direct link to bindGroups?")

`Partial`<`Record`<`number`, [`Bindings`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/Bindings.md)>>

**Deprecated**

Set bindings on RenderPass instead.

###### bindings?[​](#bindings "Direct link to bindings?")

[`Bindings`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/Bindings.md)

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

[`RenderPipelineParameters`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineParameters.md)

Parameters to be set during draw call. Note that most parameters can only be overridden in WebGL.

###### renderPass?[​](#renderpass "Direct link to renderPass?")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md)

Render pass to draw into (targeting screen or framebuffer)

###### topology?[​](#topology "Direct link to topology?")

[`PrimitiveTopology`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PrimitiveTopology.md)

Topology. Note can only be overridden in WebGL.

###### transformFeedback?[​](#transformfeedback "Direct link to transformFeedback?")

[`TransformFeedback`](https://luma.gl/next/docs/api-reference/generated/core/classes/TransformFeedback.md)

Transform feedback. WebGL only.

###### uniforms?[​](#uniforms "Direct link to uniforms?")

`Record`<`string`, `unknown`>

WebGL-only uniforms

###### vertexArray[​](#vertexarray "Direct link to vertexArray")

[`VertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/VertexArray.md)

vertex attributes

###### vertexCount?[​](#vertexcount "Direct link to vertexCount?")

`number`

Number of "rows" in 'vertex' buffers

#### Returns[​](#returns-15 "Direct link to Returns")

`boolean`

#### Deprecated[​](#deprecated-5 "Direct link to Deprecated")

Use RenderPass.setPipeline(), setBindings(), setVertexArray(), and draw(). Will be removed in the next major release.

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L174)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-16 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`getProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#getprops)

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L116)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-17 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`toJSON`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L111)

Returns a string representation of an object.

#### Returns[​](#returns-18 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#tostring)

***

### transferOwnershipTo()[​](#transferownershipto "Direct link to transferOwnershipTo()")

> **transferOwnershipTo**(`owner`): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L31)

Transfer exclusive ownership, or return lifetime responsibility to the caller with null.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### owner[​](#owner-1 "Direct link to owner")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Returns[​](#returns-19 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`transferOwnershipTo`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#transferownershipto)
