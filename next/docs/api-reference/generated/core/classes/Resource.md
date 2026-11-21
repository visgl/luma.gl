# Abstract Class: Resource

Defined in: [modules/core/src/api/adapter/resources/resource.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L8)

A device-independent lifetime with exclusive ownership and deterministic cleanup.

## Extended by[​](#extended-by "Direct link to Extended by")

* [`DeviceResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceResource.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Resource**(): `Resource`

#### Returns[​](#returns "Direct link to Returns")

`Resource`

## Accessors[​](#accessors "Direct link to Accessors")

### destroyed[​](#destroyed "Direct link to destroyed")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **destroyed**(): `boolean`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L26)

Whether destruction has completed, including when cleanup reported an error.

##### Returns[​](#returns-1 "Direct link to Returns")

`boolean`

***

### ownedResources[​](#ownedresources "Direct link to ownedResources")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **ownedResources**(): readonly `Resource`\[]

Defined in: [modules/core/src/api/adapter/resources/resource.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L21)

A snapshot of this resource's children. Mutating the snapshot cannot change ownership.

##### Returns[​](#returns-2 "Direct link to Returns")

readonly `Resource`\[]

***

### owner[​](#owner "Direct link to owner")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **owner**(): `Resource` | `null`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L16)

The resource responsible for destroying this resource, or null for caller-managed lifetime.

##### Returns[​](#returns-3 "Direct link to Returns")

`Resource` | `null`

## Methods[​](#methods "Direct link to Methods")

### ~~attachResource()~~[​](#attachresource "Direct link to attachresource")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L90)

#### Parameters[​](#parameters "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

`Resource`

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use resource.transferOwnershipTo(this).

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L84)

#### Returns[​](#returns-5 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use destroy().

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L49)

Destroy children before this resource. Subclasses implement hooks instead of overriding.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### ~~destroyAttachedResource()~~[​](#destroyattachedresource "Direct link to destroyattachedresource")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L102)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

`Resource`

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

Check resource.owner and call resource.destroy().

***

### ~~destroyAttachedResources()~~[​](#destroyattachedresources "Direct link to destroyattachedresources")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L109)

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Destroy individually owned resources, or destroy the owner.

***

### ~~detachResource()~~[​](#detachresource "Direct link to detachresource")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L95)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

`Resource`

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-4 "Direct link to Deprecated")

Use resource.transferOwnershipTo(null). Only detaches a child owned by this.

***

### transferOwnershipTo()[​](#transferownershipto "Direct link to transferOwnershipTo()")

> **transferOwnershipTo**(`owner`): `this`

Defined in: [modules/core/src/api/adapter/resources/resource.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/resource.ts#L31)

Transfer exclusive ownership, or return lifetime responsibility to the caller with null.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### owner[​](#owner-1 "Direct link to owner")

`Resource` | `null`

#### Returns[​](#returns-10 "Direct link to Returns")

`this`
