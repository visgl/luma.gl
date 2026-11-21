# Abstract Class: DeviceResource\<Props>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:98](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L98)

Base class for GPU (WebGPU/WebGL) Resources

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

## Extended by[​](#extended-by "Direct link to Extended by")

* [`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)
* [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)
* [`TextureView`](https://luma.gl/next/docs/api-reference/generated/core/classes/TextureView.md)
* [`ExternalTexture`](https://luma.gl/next/docs/api-reference/generated/core/classes/ExternalTexture.md)
* [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)
* [`Sampler`](https://luma.gl/next/docs/api-reference/generated/core/classes/Sampler.md)
* [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)
* [`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)
* [`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)
* [`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md)
* [`RenderBundle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundle.md)
* [`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)
* [`ComputePass`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePass.md)
* [`CommandEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandEncoder.md)
* [`CommandBuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandBuffer.md)
* [`VertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/VertexArray.md)
* [`TransformFeedback`](https://luma.gl/next/docs/api-reference/generated/core/classes/TransformFeedback.md)
* [`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md)
* [`Fence`](https://luma.gl/next/docs/api-reference/generated/core/classes/Fence.md)
* [`PipelineLayout`](https://luma.gl/next/docs/api-reference/generated/core/classes/PipelineLayout.md)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Props[​](#props "Direct link to Props")

`Props` *extends* [`DeviceResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceResourceProps.md) = [`DeviceResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceResourceProps.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new DeviceResource**<`Props`>(`device`, `props`, `defaultProps`): `DeviceResource`<`Props`>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L153)

Create a new DeviceResource. Called from Subclass

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props-1 "Direct link to props")

`Props`

##### defaultProps[​](#defaultprops "Direct link to defaultProps")

`Required`<`Props`>

#### Returns[​](#returns "Direct link to Returns")

`DeviceResource`<`Props`>

#### Overrides[​](#overrides "Direct link to Overrides")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L127)

The device that this resource is associated with

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L129)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:121](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L121)

props.id, for debugging.

***

### props[​](#props-2 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:123](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L123)

The props that this resource was created with

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L125)

User data object, reserved for the application

***

### defaultProps[​](#defaultprops-1 "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`DeviceResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceResourceProps.md)>

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L102)

Default properties for resource

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** `abstract` **\[toStringTag]**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L109)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### destroyed[​](#destroyed "Direct link to destroyed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **destroyed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L26)

Whether destruction has completed, including when cleanup reported an error.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyed`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyed)

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L146)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

***

### ownedResources[​](#ownedresources "Direct link to ownedResources")

#### Get Signature[​](#get-signature-3 "Direct link to Get Signature")

> **get** **ownedResources**(): readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

Defined in: [modules/core/src/api/adapter/resources/resource.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L21)

A snapshot of this resource's children. Mutating the snapshot cannot change ownership.

##### Returns[​](#returns-4 "Direct link to Returns")

readonly [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)\[]

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`ownedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#ownedresources)

***

### owner[​](#owner "Direct link to owner")

#### Get Signature[​](#get-signature-4 "Direct link to Get Signature")

> **get** **owner**(): [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L16)

The resource responsible for destroying this resource, or null for caller-managed lifetime.

##### Returns[​](#returns-5 "Direct link to Returns")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`owner`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#owner)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-5 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L139)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-6 "Direct link to Returns")

`boolean`

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

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`attachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#attachresource)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L84)

#### Returns[​](#returns-8 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use destroy().

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`delete`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L49)

Destroy children before this resource. Subclasses implement hooks instead of overriding.

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroy)

***

### ~~destroyAttachedResource()~~[​](#destroyattachedresource "Direct link to destroyattachedresource")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L102)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

Check resource.owner and call resource.destroy().

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### ~~destroyAttachedResources()~~[​](#destroyattachedresources "Direct link to destroyattachedresources")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L109)

#### Returns[​](#returns-11 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Destroy individually owned resources, or destroy the owner.

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresources)

***

### ~~detachResource()~~[​](#detachresource "Direct link to detachresource")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L95)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-4 "Direct link to Deprecated")

Use resource.transferOwnershipTo(null). Only detaches a child owned by this.

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L174)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-13 "Direct link to Returns")

`object`

returns a map of overridden default props

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:116](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L116)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-14 "Direct link to Returns")

`string`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L111)

Returns a string representation of an object.

#### Returns[​](#returns-15 "Direct link to Returns")

`string`

***

### transferOwnershipTo()[​](#transferownershipto "Direct link to transferOwnershipTo()")

> **transferOwnershipTo**(`owner`): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L31)

Transfer exclusive ownership, or return lifetime responsibility to the caller with null.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### owner[​](#owner-1 "Direct link to owner")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md) | `null`

#### Returns[​](#returns-16 "Direct link to Returns")

`this`

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`transferOwnershipTo`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#transferownershipto)
