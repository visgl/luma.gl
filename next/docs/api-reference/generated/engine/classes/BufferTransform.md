# Class: BufferTransform

Defined in: [modules/engine/src/compute/buffer-transform.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L47)

Manages a WebGL program (pipeline) for buffer→buffer transforms.

## Note[​](#note "Direct link to Note")

Only works under WebGL2.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new BufferTransform**(`device`, `props?`): `BufferTransform`

Defined in: [modules/engine/src/compute/buffer-transform.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L67)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props?[​](#props "Direct link to props?")

[`BufferTransformProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BufferTransformProps.md) = `BufferTransform.defaultProps`

#### Returns[​](#returns "Direct link to Returns")

`BufferTransform`

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/compute/buffer-transform.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L48)

***

### model[​](#model "Direct link to model")

> `readonly` **model**: [`GPUVectorModel`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUVectorModel.md)

Defined in: [modules/engine/src/compute/buffer-transform.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L49)

***

### transformFeedback[​](#transformfeedback "Direct link to transformFeedback")

> `readonly` **transformFeedback**: `TransformFeedback`

Defined in: [modules/engine/src/compute/buffer-transform.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L50)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`BufferTransformProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/BufferTransformProps.md)>

Defined in: [modules/engine/src/compute/buffer-transform.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L54)

## Methods[​](#methods "Direct link to Methods")

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `void`

Defined in: [modules/engine/src/compute/buffer-transform.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L106)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use [destroy](#destroy).

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/compute/buffer-transform.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L99)

Destroy owned resources.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### ~~getBuffer()~~[​](#getbuffer "Direct link to getbuffer")

> **getBuffer**(`varyingName`): `Buffer` | `BufferRange` | `null`

Defined in: [modules/engine/src/compute/buffer-transform.ts:165](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L165)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### varyingName[​](#varyingname "Direct link to varyingName")

`string`

#### Returns[​](#returns-3 "Direct link to Returns")

`Buffer` | `BufferRange` | `null`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

App knows what buffers it is passing in - Returns the Buffer or BufferRange for given varying name.

***

### ~~readAsync()~~[​](#readasync "Direct link to readasync")

> **readAsync**(`varyingName`): `Promise`<`Uint8Array`<`ArrayBufferLike`>>

Defined in: [modules/engine/src/compute/buffer-transform.ts:170](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L170)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### varyingName[​](#varyingname-1 "Direct link to varyingName")

`string`

#### Returns[​](#returns-4 "Direct link to Returns")

`Promise`<`Uint8Array`<`ArrayBufferLike`>>

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

App knows what buffers it is passing in - Reads the Buffer or BufferRange for given varying name.

***

### run()[​](#run "Direct link to run()")

> **run**(`options?`): `void`

Defined in: [modules/engine/src/compute/buffer-transform.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L111)

Run one transform loop.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

`ResourceProps` & `object` & `object`

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### setOutputVectors()[​](#setoutputvectors "Direct link to setOutputVectors()")

> **setOutputVectors**(`vectors`): `void`

Defined in: [modules/engine/src/compute/buffer-transform.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L136)

Binds borrowed output ranges without taking ownership or repacking vector chunks.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### vectors[​](#vectors "Direct link to vectors")

[`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### isSupported()[​](#issupported "Direct link to isSupported()")

> `static` **isSupported**(`device`): `boolean`

Defined in: [modules/engine/src/compute/buffer-transform.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L63)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### device[​](#device-2 "Direct link to device")

`Device`

#### Returns[​](#returns-7 "Direct link to Returns")

`boolean`
