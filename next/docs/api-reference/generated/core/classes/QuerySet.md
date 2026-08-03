# Abstract Class: QuerySet

Defined in: [modules/core/src/adapter/resources/query-set.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L28)

Immutable QuerySet object

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`QuerySetProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/QuerySetProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new QuerySet**(`device`, `props`): `QuerySet`

Defined in: [modules/core/src/adapter/resources/query-set.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L33)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`QuerySetProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/QuerySetProps.md)

#### Returns[​](#returns "Direct link to Returns")

`QuerySet`

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

> `static` **defaultProps**: `Required`<[`QuerySetProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/QuerySetProps.md)>

Defined in: [modules/core/src/adapter/resources/query-set.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L37)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/query-set.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L29)

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

> **destroy**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L173)

destroy can be called on any resource to release it before it is garbage collected.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

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

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

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

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-10 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`getProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#getprops)

***

### isResultAvailable()[​](#isresultavailable "Direct link to isResultAvailable()")

> `abstract` **isResultAvailable**(`queryIndex?`): `boolean`

Defined in: [modules/core/src/adapter/resources/query-set.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L47)

Returns true if the requested result has been captured and can be read without blocking. Backends may implement this conservatively.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### queryIndex?[​](#queryindex "Direct link to queryIndex?")

`number`

#### Returns[​](#returns-11 "Direct link to Returns")

`boolean`

***

### readResults()[​](#readresults "Direct link to readResults()")

> `abstract` **readResults**(`options?`): `Promise`<`bigint`\[]>

Defined in: [modules/core/src/adapter/resources/query-set.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L50)

Reads query results as 64-bit values.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

###### firstQuery?[​](#firstquery "Direct link to firstQuery?")

`number`

###### queryCount?[​](#querycount "Direct link to queryCount?")

`number`

#### Returns[​](#returns-12 "Direct link to Returns")

`Promise`<`bigint`\[]>

***

### readTimestampDuration()[​](#readtimestampduration "Direct link to readTimestampDuration()")

> `abstract` **readTimestampDuration**(`beginIndex`, `endIndex`): `Promise`<`number`>

Defined in: [modules/core/src/adapter/resources/query-set.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/query-set.ts#L56)

Reads a timestamp duration in milliseconds between a begin and end query index. Portable duration profiling requires adjacent indices that identify one logical pair.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### beginIndex[​](#beginindex "Direct link to beginIndex")

`number`

##### endIndex[​](#endindex "Direct link to endIndex")

`number`

#### Returns[​](#returns-13 "Direct link to Returns")

`Promise`<`number`>

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-14 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`toJSON`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-15 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md#tostring)
