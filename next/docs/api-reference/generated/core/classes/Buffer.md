# Abstract Class: Buffer

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L29)

Abstract GPU buffer

## Extends[​](#extends "Direct link to Extends")

* [`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md)<[`BufferProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Buffer**(`device`, `props`): `Buffer`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L60)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`BufferProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferProps.md)

#### Returns[​](#returns "Direct link to Returns")

`Buffer`

#### Overrides[​](#overrides "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### byteLength[​](#bytelength "Direct link to byteLength")

> `abstract` **byteLength**: `number`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L56)

Length of buffer in bytes

***

### debugData[​](#debugdata "Direct link to debugData")

> **debugData**: `ArrayBuffer`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L125)

A partial CPU-side copy of the data in this buffer, for debugging purposes

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L127)

The device that this resource is associated with

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`device`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#device)

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L129)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`handle`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#handle)

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:121](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L121)

props.id, for debugging.

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`id`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#id)

***

### indexType?[​](#indextype "Direct link to indexType?")

> `readonly` `optional` **indexType?**: `"uint8"` | `"uint16"` | `"uint32"`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L54)

For index buffers, whether indices are 8, 16 or 32 bit. Note: uint8 indices are automatically converted to uint16 for WebGPU compatibility

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L123)

The props that this resource was created with

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`props`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#props-1)

***

### updateTimestamp[​](#updatetimestamp "Direct link to updateTimestamp")

> **updateTimestamp**: `number`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L58)

"Time" of last update, can be used to check if redraw is needed

***

### usage[​](#usage "Direct link to usage")

> `readonly` **usage**: `number`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L52)

The usage with which this buffer was created

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L125)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#userdata)

***

### COPY\_DST[​](#copy_dst "Direct link to COPY_DST")

> `static` **COPY\_DST**: `number` = `0x0008`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L45)

***

### COPY\_SRC[​](#copy_src "Direct link to COPY_SRC")

> `static` **COPY\_SRC**: `number` = `0x0004`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L44)

***

### DEBUG\_DATA\_MAX\_LENGTH[​](#debug_data_max_length "Direct link to DEBUG_DATA_MAX_LENGTH")

> `static` **DEBUG\_DATA\_MAX\_LENGTH**: `number` = `32`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L122)

Max amount of debug data saved. Two vec4's

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`BufferProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferProps.md)>

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L159)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#defaultprops)

***

### INDEX[​](#index "Direct link to INDEX")

> `static` **INDEX**: `number` = `0x0010`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L31)

Index buffer

***

### INDIRECT[​](#indirect "Direct link to INDIRECT")

> `static` **INDIRECT**: `number` = `0x0100`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L38)

***

### MAP\_READ[​](#map_read "Direct link to MAP_READ")

> `static` **MAP\_READ**: `number` = `0x01`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L42)

***

### MAP\_WRITE[​](#map_write "Direct link to MAP_WRITE")

> `static` **MAP\_WRITE**: `number` = `0x02`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L43)

***

### QUERY\_RESOLVE[​](#query_resolve "Direct link to QUERY_RESOLVE")

> `static` **QUERY\_RESOLVE**: `number` = `0x0200`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L39)

***

### STORAGE[​](#storage "Direct link to STORAGE")

> `static` **STORAGE**: `number` = `0x0080`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L37)

Storage buffer

***

### UNIFORM[​](#uniform "Direct link to UNIFORM")

> `static` **UNIFORM**: `number` = `0x0040`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L35)

Uniform buffer

***

### VERTEX[​](#vertex "Direct link to VERTEX")

> `static` **VERTEX**: `number` = `0x0020`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L33)

Vertex buffer

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L47)

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

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L146)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`isHandleBorrowed`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#ishandleborrowed)

***

### ownedResources[​](#ownedresources "Direct link to ownedResources")

#### Get Signature[​](#get-signature-3 "Direct link to Get Signature")

> **get** **ownedResources**(): readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

Defined in: [modules/core/src/api/adapter/resources/resource.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L21)

A snapshot of this resource's children. Mutating the snapshot cannot change ownership.

##### Returns[​](#returns-4 "Direct link to Returns")

readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`ownedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#ownedresources)

***

### owner[​](#owner "Direct link to owner")

#### Get Signature[​](#get-signature-4 "Direct link to Get Signature")

> **get** **owner**(): [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L16)

The resource responsible for destroying this resource, or null for caller-managed lifetime.

##### Returns[​](#returns-5 "Direct link to Returns")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`owner`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#owner)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-5 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L139)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-6 "Direct link to Returns")

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

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use resource.transferOwnershipTo(this).

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`attachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#attachresource)

***

### clone()[​](#clone "Direct link to clone()")

> **clone**(`props`): `Buffer`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L90)

Create a copy of this Buffer with new byteLength, with same props but of the specified size.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

###### byteLength[​](#bytelength-1 "Direct link to byteLength")

`number`

#### Returns[​](#returns-8 "Direct link to Returns")

`Buffer`

#### Note[​](#note "Direct link to Note")

Does not copy contents of the cloned Buffer.

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L84)

#### Returns[​](#returns-9 "Direct link to Returns")

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

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroy)

***

### ~~destroyAttachedResource()~~[​](#destroyattachedresource "Direct link to destroyattachedresource")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L102)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

Check resource.owner and call resource.destroy().

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroyAttachedResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroyattachedresource)

***

### ~~destroyAttachedResources()~~[​](#destroyattachedresources "Direct link to destroyattachedresources")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L109)

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Destroy individually owned resources, or destroy the owner.

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroyAttachedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroyattachedresources)

***

### ~~detachResource()~~[​](#detachresource "Direct link to detachresource")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L95)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-4 "Direct link to Deprecated")

Use resource.transferOwnershipTo(null). Only detaches a child owned by this.

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`detachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#detachresource)

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L174)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-14 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`getProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#getprops)

***

### mapAndReadAsync()[​](#mapandreadasync "Direct link to mapAndReadAsync()")

> `abstract` **mapAndReadAsync**<`T`>(`onMapped`, `byteOffset?`, `byteLength?`): `Promise`<`T`>

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:110](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L110)

Maps buffer data to CPU memory. Mapped memory is only accessible in the callback

#### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

##### T[​](#t "Direct link to T")

`T`

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### onMapped[​](#onmapped "Direct link to onMapped")

[`BufferMapCallback`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferMapCallback.md)<`T`>

##### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

`number`

##### byteLength?[​](#bytelength-2 "Direct link to byteLength?")

`number`

#### Returns[​](#returns-15 "Direct link to Returns")

`Promise`<`T`>

***

### mapAndWriteAsync()[​](#mapandwriteasync "Direct link to mapAndWriteAsync()")

> `abstract` **mapAndWriteAsync**(`onMapped`, `byteOffset?`, `byteLength?`): `Promise`<`void`>

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:100](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L100)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### onMapped[​](#onmapped-1 "Direct link to onMapped")

[`BufferMapCallback`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferMapCallback.md)<`void` | `Promise`<`void`>>

##### byteOffset?[​](#byteoffset-1 "Direct link to byteOffset?")

`number`

##### byteLength?[​](#bytelength-3 "Direct link to byteLength?")

`number`

#### Returns[​](#returns-16 "Direct link to Returns")

`Promise`<`void`>

***

### readAsync()[​](#readasync "Direct link to readAsync()")

> `abstract` **readAsync**(`byteOffset?`, `byteLength?`): `Promise`<`Uint8Array`<`ArrayBufferLike`>>

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L107)

Reads data asynchronously, returns a copy of the buffer data

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### byteOffset?[​](#byteoffset-2 "Direct link to byteOffset?")

`number`

##### byteLength?[​](#bytelength-4 "Direct link to byteLength?")

`number`

#### Returns[​](#returns-17 "Direct link to Returns")

`Promise`<`Uint8Array`<`ArrayBufferLike`>>

***

### readSyncWebGL()[​](#readsyncwebgl "Direct link to readSyncWebGL()")

> `abstract` **readSyncWebGL**(`byteOffset?`, `byteLength?`): `Uint8Array`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:117](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L117)

Read data synchronously.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### byteOffset?[​](#byteoffset-3 "Direct link to byteOffset?")

`number`

##### byteLength?[​](#bytelength-5 "Direct link to byteLength?")

`number`

#### Returns[​](#returns-18 "Direct link to Returns")

`Uint8Array`

#### Note[​](#note-1 "Direct link to Note")

WebGL2 only

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L116)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-19 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`toJSON`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L111)

Returns a string representation of an object.

#### Returns[​](#returns-20 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#tostring)

***

### transferOwnershipTo()[​](#transferownershipto "Direct link to transferOwnershipTo()")

> **transferOwnershipTo**(`owner`): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L31)

Transfer exclusive ownership, or return lifetime responsibility to the caller with null.

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### owner[​](#owner-1 "Direct link to owner")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Returns[​](#returns-21 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`transferOwnershipTo`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#transferownershipto)

***

### write()[​](#write "Direct link to write()")

> `abstract` **write**(`data`, `byteOffset?`): `void`

Defined in: [modules/core/src/api/adapter/resources/buffer.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/buffer.ts#L95)

Write data to buffer

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### data[​](#data "Direct link to data")

`ArrayBufferLike` | `ArrayBufferView`<`ArrayBufferLike`>

##### byteOffset?[​](#byteoffset-4 "Direct link to byteOffset?")

`number`

#### Returns[​](#returns-22 "Direct link to Returns")

`void`
