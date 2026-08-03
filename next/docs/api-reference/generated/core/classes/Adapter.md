# Abstract Class: Adapter

Defined in: [modules/core/src/adapter/adapter.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L11)

Create and attach devices for a specific backend.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Adapter**(): `Adapter`

#### Returns[​](#returns "Direct link to Returns")

`Adapter`

## Properties[​](#properties "Direct link to Properties")

### type[​](#type "Direct link to type")

> `abstract` **type**: `string`

Defined in: [modules/core/src/adapter/adapter.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L13)

## Accessors[​](#accessors "Direct link to Accessors")

### pageLoaded[​](#pageloaded "Direct link to pageLoaded")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **pageLoaded**(): `Promise`<`void`>

Defined in: [modules/core/src/adapter/adapter.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L30)

Page load promise Resolves when the DOM is loaded.

##### Note[​](#note "Direct link to Note")

Since are be limitations on number of `load` event listeners, it is recommended avoid calling this accessor until actually needed. I.e. we don't call it unless you know that you will be looking up a string in the DOM.

##### Returns[​](#returns-1 "Direct link to Returns")

`Promise`<`void`>

## Methods[​](#methods "Direct link to Methods")

### attach()[​](#attach "Direct link to attach()")

> `abstract` **attach**(`handle`, `props`): `Promise`<[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)>

Defined in: [modules/core/src/adapter/adapter.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L21)

Attach a Device to a valid handle for this backend (GPUDevice, WebGL2RenderingContext etc)

#### Parameters[​](#parameters "Direct link to Parameters")

##### handle[​](#handle "Direct link to handle")

`unknown`

##### props[​](#props "Direct link to props")

[`DeviceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceProps.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`Promise`<[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)>

***

### create()[​](#create "Direct link to create()")

> `abstract` **create**(`props`): `Promise`<[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)>

Defined in: [modules/core/src/adapter/adapter.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L19)

Create a new device for this backend

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

[`DeviceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`Promise`<[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)>

***

### isDeviceHandle()[​](#isdevicehandle "Direct link to isDeviceHandle()")

> `abstract` **isDeviceHandle**(`handle`): `boolean`

Defined in: [modules/core/src/adapter/adapter.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L17)

Check if the given handle is a valid device handle for this backend

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### handle[​](#handle-1 "Direct link to handle")

`unknown`

#### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

***

### isSupported()[​](#issupported "Direct link to isSupported()")

> `abstract` **isSupported**(): `boolean`

Defined in: [modules/core/src/adapter/adapter.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/adapter.ts#L15)

Check if this backend is supported

#### Returns[​](#returns-5 "Direct link to Returns")

`boolean`
