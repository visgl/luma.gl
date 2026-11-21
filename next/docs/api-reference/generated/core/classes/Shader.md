# Abstract Class: Shader

Defined in: [modules/core/src/api/adapter/resources/shader.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L34)

Immutable Shader object In WebGPU the handle can be copied between threads

## Extends[​](#extends "Direct link to Extends")

* [`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md)<[`ShaderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Shader**(`device`, `props`): `Shader`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L47)

Create a new Shader instance

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`ShaderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderProps.md)

#### Returns[​](#returns "Direct link to Returns")

`Shader`

#### Overrides[​](#overrides "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### compilationStatus[​](#compilationstatus "Direct link to compilationStatus")

> **compilationStatus**: `"error"` | `"pending"` | `"success"` = `'pending'`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L44)

The compilation status of the shader. 'pending' if compilation is asynchronous, and on production

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

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L123)

The props that this resource was created with

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`props`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#props-1)

***

### source[​](#source "Direct link to source")

> `readonly` **source**: `string`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L42)

The source code of this shader

***

### stage[​](#stage "Direct link to stage")

> `readonly` **stage**: `"vertex"` | `"fragment"` | `"compute"`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L40)

The stage of this shader

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L125)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#userdata)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`ShaderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderProps.md)>

Defined in: [modules/core/src/api/adapter/resources/shader.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L147)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L35)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`[toStringTag]`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#tostringtag)

***

### asyncCompilationStatus[​](#asynccompilationstatus "Direct link to asyncCompilationStatus")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** `abstract` **asyncCompilationStatus**(): `Promise`<`"error"` | `"pending"` | `"success"`>

Defined in: [modules/core/src/api/adapter/resources/shader.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L54)

##### Returns[​](#returns-2 "Direct link to Returns")

`Promise`<`"error"` | `"pending"` | `"success"`>

***

### destroyed[​](#destroyed "Direct link to destroyed")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **destroyed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L26)

Whether destruction has completed, including when cleanup reported an error.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`destroyed`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#destroyed)

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

### ownedResources[​](#ownedresources "Direct link to ownedResources")

#### Get Signature[​](#get-signature-4 "Direct link to Get Signature")

> **get** **ownedResources**(): readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

Defined in: [modules/core/src/api/adapter/resources/resource.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L21)

A snapshot of this resource's children. Mutating the snapshot cannot change ownership.

##### Returns[​](#returns-5 "Direct link to Returns")

readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`ownedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#ownedresources)

***

### owner[​](#owner "Direct link to owner")

#### Get Signature[​](#get-signature-5 "Direct link to Get Signature")

> **get** **owner**(): [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L16)

The resource responsible for destroying this resource, or null for caller-managed lifetime.

##### Returns[​](#returns-6 "Direct link to Returns")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`owner`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#owner)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-6 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L139)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-7 "Direct link to Returns")

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

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use resource.transferOwnershipTo(this).

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`attachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#attachresource)

***

### debugShader()[​](#debugshader "Direct link to debugShader()")

> **debugShader**(): `Promise`<`void`>

Defined in: [modules/core/src/api/adapter/resources/shader.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L72)

In browser logging of errors

#### Returns[​](#returns-9 "Direct link to Returns")

`Promise`<`void`>

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

### getCompilationInfo()[​](#getcompilationinfo "Direct link to getCompilationInfo()")

> `abstract` **getCompilationInfo**(): `Promise`\<readonly [`CompilerMessage`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompilerMessage.md)\[]>

Defined in: [modules/core/src/api/adapter/resources/shader.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L57)

Get compiler log asynchronously

#### Returns[​](#returns-15 "Direct link to Returns")

`Promise`\<readonly [`CompilerMessage`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompilerMessage.md)\[]>

***

### getCompilationInfoSync()[​](#getcompilationinfosync "Direct link to getCompilationInfoSync()")

> **getCompilationInfoSync**(): readonly [`CompilerMessage`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompilerMessage.md)\[] | `null`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L60)

Get compiler log synchronously (WebGL only)

#### Returns[​](#returns-16 "Direct link to Returns")

readonly [`CompilerMessage`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompilerMessage.md)\[] | `null`

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L174)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-17 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`getProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#getprops)

***

### getTranslatedSource()[​](#gettranslatedsource "Direct link to getTranslatedSource()")

> **getTranslatedSource**(): `string` | `null`

Defined in: [modules/core/src/api/adapter/resources/shader.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/shader.ts#L65)

Get translated shader source in host platform's native language (HLSL, GLSL, and even GLSL ES), if available

#### Returns[​](#returns-18 "Direct link to Returns")

`string` | `null`

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

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### owner[​](#owner-1 "Direct link to owner")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Returns[​](#returns-21 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md).[`transferOwnershipTo`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md#transferownershipto)
