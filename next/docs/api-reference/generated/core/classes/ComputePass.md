# Abstract Class: ComputePass

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L20)

Base class for GPU (WebGPU/WebGL) Resources

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ComputePassProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputePassProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ComputePass**(`device`, `props`): `ComputePass`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L21)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`ComputePassProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputePassProps.md)

#### Returns[​](#returns "Direct link to Returns")

`ComputePass`

#### Overrides[​](#overrides "Direct link to Overrides")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean` = `false`

Defined in: [modules/core/src/adapter/resources/resource.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L131)

Whether this resource has been destroyed

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyed`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyed)

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/adapter/resources/resource.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L124)

The device that this resource is associated with

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#device)

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L126)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`handle`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#handle)

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L118)

props.id, for debugging.

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`id`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#id)

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L120)

The props that this resource was created with

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`props`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#props-1)

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/adapter/resources/resource.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L122)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#userdata)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`ComputePassProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputePassProps.md)>

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L56)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L63)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`[toStringTag]`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#tostringtag)

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L147)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`isHandleBorrowed`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#ishandleborrowed)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L140)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`ownsHandle`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#ownshandle)

## Methods[​](#methods "Direct link to Methods")

### attachResource()[​](#attachresource "Direct link to attachResource()")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L200)

Attaches a resource. Attached resources are auto destroyed when this resource is destroyed Called automatically when sub resources are auto created but can be called by application

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`attachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#attachresource)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-5 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use destroy()

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`delete`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> `abstract` **destroy**(): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L25)

destroy can be called on any resource to release it before it is garbage collected.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

#### Overrides[​](#overrides-3 "Direct link to Overrides")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroy)

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresources)

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### dispatch()[​](#dispatch "Direct link to dispatch()")

> `abstract` **dispatch**(`x`, `y?`, `z?`): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L40)

Dispatch work to be performed with the current ComputePipeline.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### x[​](#x "Direct link to x")

`number`

X dimension of the grid of workgroups to dispatch.

##### y?[​](#y "Direct link to y?")

`number`

Y dimension of the grid of workgroups to dispatch.

##### z?[​](#z "Direct link to z?")

`number`

Z dimension of the grid of workgroups to dispatch.

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

***

### dispatchIndirect()[​](#dispatchindirect "Direct link to dispatchIndirect()")

> `abstract` **dispatchIndirect**(`indirectBuffer`, `indirectOffset?`): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L47)

Dispatch work to be performed with the current ComputePipeline.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### indirectBuffer[​](#indirectbuffer "Direct link to indirectBuffer")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

buffer must be a tightly packed block of three 32-bit unsigned integer values (12 bytes total), given in the same order as the arguments for dispatch()

##### indirectOffset?[​](#indirectoffset "Direct link to indirectOffset?")

`number`

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

***

### end()[​](#end "Direct link to end()")

> `abstract` **end**(): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L27)

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-13 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`getProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#getprops)

***

### insertDebugMarker()[​](#insertdebugmarker "Direct link to insertDebugMarker()")

> `abstract` **insertDebugMarker**(`markerLabel`): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L54)

Marks a point in a stream of commands with a label

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### markerLabel[​](#markerlabel "Direct link to markerLabel")

`string`

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

***

### popDebugGroup()[​](#popdebuggroup "Direct link to popDebugGroup()")

> `abstract` **popDebugGroup**(): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L52)

Ends the labeled debug group most recently started by pushDebugGroup()

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

***

### pushDebugGroup()[​](#pushdebuggroup "Direct link to pushDebugGroup()")

> `abstract` **pushDebugGroup**(`groupLabel`): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L50)

Begins a labeled debug group containing subsequent commands

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### groupLabel[​](#grouplabel "Direct link to groupLabel")

`string`

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

***

### setPipeline()[​](#setpipeline "Direct link to setPipeline()")

> `abstract` **setPipeline**(`pipeline`): `void`

Defined in: [modules/core/src/adapter/resources/compute-pass.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/compute-pass.ts#L29)

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### pipeline[​](#pipeline "Direct link to pipeline")

[`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

#### Returns[​](#returns-17 "Direct link to Returns")

`void`

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-18 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`toJSON`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-19 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#tostring)
