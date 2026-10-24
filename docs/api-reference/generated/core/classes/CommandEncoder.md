# Abstract Class: CommandEncoder

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:145](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L145)

Records commands onto a single backend command encoder and can finish them into one command buffer. Resource helpers invoked through a CommandEncoder must record onto that encoder rather than allocating hidden encoders or submitting work eagerly.

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`CommandEncoderProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CommandEncoderProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new CommandEncoder**(`device`, `props`): `CommandEncoder`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:154](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L154)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`CommandEncoderProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CommandEncoderProps.md)

#### Returns[​](#returns "Direct link to Returns")

`CommandEncoder`

#### Overrides[​](#overrides "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`constructor`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### \_gpuTimeMs?[​](#_gputimems "Direct link to _gpuTimeMs?")

> `optional` **\_gpuTimeMs?**: `number`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:152](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L152)

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

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L126)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`handle`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#handle)

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L118)

props.id, for debugging.

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`id`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#id)

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L120)

The props that this resource was created with

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`props`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#props-1)

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/adapter/resources/resource.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L122)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`userData`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#userdata)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`CommandEncoderProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CommandEncoderProps.md)>

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:286](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L286)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`defaultProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L146)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`[toStringTag]`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostringtag)

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L147)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`isHandleBorrowed`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#ishandleborrowed)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L140)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

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

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`attachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#attachresource)

***

### beginComputePass()[​](#begincomputepass "Direct link to beginComputePass()")

> `abstract` **beginComputePass**(`props?`): [`ComputePass`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePass.md)

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:171](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L171)

Create a ComputePass using the default CommandEncoder

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### props?[​](#props-2 "Direct link to props?")

[`ComputePassProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ComputePassProps.md)

#### Returns[​](#returns-5 "Direct link to Returns")

[`ComputePass`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePass.md)

***

### beginRenderPass()[​](#beginrenderpass "Direct link to beginRenderPass()")

> `abstract` **beginRenderPass**(`props?`): [`RenderPass`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPass.md)

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:168](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L168)

Create a RenderPass using the default CommandEncoder

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### props?[​](#props-3 "Direct link to props?")

[`RenderPassProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPassProps.md)

#### Returns[​](#returns-6 "Direct link to Returns")

[`RenderPass`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPass.md)

***

### copyBufferToBuffer()[​](#copybuffertobuffer "Direct link to copyBufferToBuffer()")

> `abstract` **copyBufferToBuffer**(`options`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L174)

Add a command that that copies data from a sub-region of a Buffer to a sub-region of another Buffer.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options[​](#options "Direct link to options")

[`CopyBufferToBufferOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyBufferToBufferOptions.md)

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### copyBufferToTexture()[​](#copybuffertotexture "Direct link to copyBufferToTexture()")

> `abstract` **copyBufferToTexture**(`options`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:177](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L177)

Add a command that copies data from a sub-region of a GPUBuffer to a sub-region of one or multiple continuous texture subresources.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### options[​](#options-1 "Direct link to options")

[`CopyBufferToTextureOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyBufferToTextureOptions.md)

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### copyTextureToBuffer()[​](#copytexturetobuffer "Direct link to copyTextureToBuffer()")

> `abstract` **copyTextureToBuffer**(`options`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:180](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L180)

Add a command that copies data from a sub-region of one or multiple continuous texture subresources to a sub-region of a Buffer.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### options[​](#options-2 "Direct link to options")

[`CopyTextureToBufferOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyTextureToBufferOptions.md)

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

***

### copyTextureToTexture()[​](#copytexturetotexture "Direct link to copyTextureToTexture()")

> `abstract` **copyTextureToTexture**(`options`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:183](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L183)

Add a command that copies data from a sub-region of one or multiple contiguous texture subresources to another sub-region of one or multiple continuous texture subresources.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### options[​](#options-3 "Direct link to options")

[`CopyTextureToTextureOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyTextureToTextureOptions.md)

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-11 "Direct link to Returns")

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

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroy`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroy)

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResources`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresources)

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### finish()[​](#finish "Direct link to finish()")

> `abstract` **finish**(): [`CommandBuffer`](https://luma.gl/docs/api-reference/generated/core/classes/CommandBuffer.md)

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:165](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L165)

Completes recording and invalidates this encoder.

#### Returns[​](#returns-16 "Direct link to Returns")

[`CommandBuffer`](https://luma.gl/docs/api-reference/generated/core/classes/CommandBuffer.md)

A single-use `CommandBuffer` that inherits this encoder's `id` and `userData`.

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-17 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`getProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#getprops)

***

### getTimeProfilingQuerySet()[​](#gettimeprofilingqueryset "Direct link to getTimeProfilingQuerySet()")

> **getTimeProfilingQuerySet**(): [`QuerySet`](https://luma.gl/docs/api-reference/generated/core/classes/QuerySet.md) | `null`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:236](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L236)

#### Returns[​](#returns-18 "Direct link to Returns")

[`QuerySet`](https://luma.gl/docs/api-reference/generated/core/classes/QuerySet.md) | `null`

***

### getTimeProfilingSlotCount()[​](#gettimeprofilingslotcount "Direct link to getTimeProfilingSlotCount()")

> **getTimeProfilingSlotCount**(): `number`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:232](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L232)

Returns the number of query slots consumed by automatic pass profiling on this encoder.

#### Returns[​](#returns-19 "Direct link to Returns")

`number`

***

### insertDebugMarker()[​](#insertdebugmarker "Direct link to insertDebugMarker()")

> `abstract` **insertDebugMarker**(`markerLabel`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:280](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L280)

Marks a point in a stream of commands with a label

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### markerLabel[​](#markerlabel "Direct link to markerLabel")

`string`

#### Returns[​](#returns-20 "Direct link to Returns")

`void`

***

### popDebugGroup()[​](#popdebuggroup "Direct link to popDebugGroup()")

> `abstract` **popDebugGroup**(): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:278](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L278)

Ends the labeled debug group most recently started by pushDebugGroup()

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

***

### pushDebugGroup()[​](#pushdebuggroup "Direct link to pushDebugGroup()")

> `abstract` **pushDebugGroup**(`groupLabel`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:276](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L276)

Begins a labeled debug group containing subsequent commands

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### groupLabel[​](#grouplabel "Direct link to groupLabel")

`string`

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

***

### resolveQuerySet()[​](#resolvequeryset "Direct link to resolveQuerySet()")

> `abstract` **resolveQuerySet**(`querySet`, `destination`, `options?`): `void`

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:191](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L191)

Reads results from a query set into a GPU buffer. Values are 64 bits so byteLength must be querySet.props.count \* 8

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### querySet[​](#queryset "Direct link to querySet")

[`QuerySet`](https://luma.gl/docs/api-reference/generated/core/classes/QuerySet.md)

##### destination[​](#destination "Direct link to destination")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

##### options?[​](#options-4 "Direct link to options?")

###### destinationOffset?[​](#destinationoffset "Direct link to destinationOffset?")

`number`

###### firstQuery?[​](#firstquery "Direct link to firstQuery?")

`number`

###### queryCount?[​](#querycount "Direct link to queryCount?")

`number`

#### Returns[​](#returns-23 "Direct link to Returns")

`void`

***

### resolveTimeProfilingQuerySet()[​](#resolvetimeprofilingqueryset "Direct link to resolveTimeProfilingQuerySet()")

> **resolveTimeProfilingQuerySet**(): `Promise`<`void`>

Defined in: [modules/core/src/adapter/resources/command-encoder.ts:205](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/command-encoder.ts#L205)

Reads all resolved timestamp pairs on the current profiler query set and caches the sum as milliseconds on this encoder.

#### Returns[​](#returns-24 "Direct link to Returns")

`Promise`<`void`>

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-25 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toJSON`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-26 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toString`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostring)
