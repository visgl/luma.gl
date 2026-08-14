# Class: DeviceFeatures

Defined in: [modules/core/src/adapter/device.ts:248](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L248)

Set-like class for features (lets apps check for WebGL / WebGPU extensions)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new DeviceFeatures**(`features?`, `disabledFeatures`): `DeviceFeatures`

Defined in: [modules/core/src/adapter/device.ts:252](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L252)

#### Parameters[​](#parameters "Direct link to Parameters")

##### features?[​](#features "Direct link to features?")

[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md)\[] = `[]`

##### disabledFeatures[​](#disabledfeatures "Direct link to disabledFeatures")

`Partial`<`Record`<[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md), `boolean`>>

#### Returns[​](#returns "Direct link to Returns")

`DeviceFeatures`

## Methods[​](#methods "Direct link to Methods")

### \[iterator]\()[​](#iterator "Direct link to \[iterator]()")

> **\[iterator]**(): `IterableIterator`<[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md)>

Defined in: [modules/core/src/adapter/device.ts:260](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L260)

#### Returns[​](#returns-1 "Direct link to Returns")

`IterableIterator`<[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md)>

***

### has()[​](#has "Direct link to has()")

> **has**(`feature`): `boolean`

Defined in: [modules/core/src/adapter/device.ts:264](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L264)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### feature[​](#feature "Direct link to feature")

[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`boolean`
