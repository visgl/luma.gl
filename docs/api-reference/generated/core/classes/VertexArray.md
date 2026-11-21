# Abstract Class: VertexArray

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L28)

Stores attribute bindings. Makes it easy to share a render pipeline and use separate vertex arrays.

## Note[​](#note "Direct link to Note")

Backend-specific attribute accessor metadata is no longer stored in the shared base class. WebGL derives and caches that information in its own implementation, while WebGPU only tracks the logical buffer bindings it needs to rebind at draw time.

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`VertexArrayProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/VertexArrayProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new VertexArray**(`device`, `props`): `VertexArray`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L52)

Creates a backend-agnostic vertex-array container.

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

The device that owns the vertex array.

##### props[​](#props "Direct link to props")

[`VertexArrayProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/VertexArrayProps.md)

Vertex-array initialization properties.

#### Returns[​](#returns "Direct link to Returns")

`VertexArray`

#### Overrides[​](#overrides "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`constructor`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> **attributes**: ([`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md) | [`TypedArray`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TypedArray.md) | `null`)\[]

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L45)

Buffers or constants indexed by backend-defined buffer slot or attribute location.

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

### indexBuffer[​](#indexbuffer "Direct link to indexBuffer")

> **indexBuffer**: [`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md) | `null` = `null`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L43)

Index buffer

***

### maxVertexAttributes[​](#maxvertexattributes "Direct link to maxVertexAttributes")

> `readonly` **maxVertexAttributes**: `number`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L40)

Max number of vertex attributes

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

> `static` **defaultProps**: `Required`<[`VertexArrayProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/VertexArrayProps.md)>

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L29)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`defaultProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L35)

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

### bindBeforeRender()[​](#bindbeforerender "Direct link to bindBeforeRender()")

> `abstract` **bindBeforeRender**(`renderPass`): `void`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L64)

Applies any backend-specific bindings required before a draw call.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### renderPass[​](#renderpass "Direct link to renderPass")

[`RenderPass`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPass.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-6 "Direct link to Returns")

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

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroy`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroy)

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResources`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresources)

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### getBufferSlot()[​](#getbufferslot "Direct link to getBufferSlot()")

> **getBufferSlot**(`bufferName`): `number` | `null`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L69)

Returns the backend-defined slot for a logical buffer name, if known.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### bufferName[​](#buffername "Direct link to bufferName")

`string`

#### Returns[​](#returns-11 "Direct link to Returns")

`number` | `null`

***

### getDrawValidationError()[​](#getdrawvalidationerror "Direct link to getDrawValidationError()")

> **getDrawValidationError**(): `string` | `null`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L74)

Returns a draw-blocking validation error, or null if this vertex array can be drawn.

#### Returns[​](#returns-12 "Direct link to Returns")

`string` | `null`

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

### setBuffer()[​](#setbuffer "Direct link to setBuffer()")

> `abstract` **setBuffer**(`bufferSlot`, `buffer`): `void`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L61)

Sets one backend-defined buffer slot or attribute location.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### bufferSlot[​](#bufferslot "Direct link to bufferSlot")

`number`

##### buffer[​](#buffer "Direct link to buffer")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md) | `null`

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

***

### ~~setConstantWebGL()~~[​](#setconstantwebgl "Direct link to setconstantwebgl")

> **setConstantWebGL**(`location`, `value`): `void`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L81)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### location[​](#location "Direct link to location")

`number`

##### value[​](#value "Direct link to value")

[`TypedArray`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TypedArray.md) | `null`

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Set constant attributes (WebGL only)

***

### setIndexBuffer()[​](#setindexbuffer "Direct link to setIndexBuffer()")

> `abstract` **setIndexBuffer**(`indices`): `void`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L59)

Sets the index buffer used for indexed rendering.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### indices[​](#indices "Direct link to indices")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md) | `null`

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-17 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toJSON`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-18 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toString`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostring)

***

### unbindAfterRender()[​](#unbindafterrender "Direct link to unbindAfterRender()")

> `abstract` **unbindAfterRender**(`renderPass`): `void`

Defined in: [modules/core/src/adapter/resources/vertex-array.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/vertex-array.ts#L66)

Clears any backend-specific bindings after a draw call.

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### renderPass[​](#renderpass-1 "Direct link to renderPass")

[`RenderPass`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPass.md)

#### Returns[​](#returns-19 "Direct link to Returns")

`void`
