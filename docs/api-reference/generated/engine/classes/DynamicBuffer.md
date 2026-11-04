# Class: DynamicBuffer

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:45

Optional convenience wrapper around an immutable core Buffer.

`DynamicBuffer` keeps a stable application object while allowing the backing GPU buffer to be replaced on resize. Engine classes such as [Model](https://luma.gl/docs/api-reference/generated/engine/classes/Model.md) and [Material](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md) resolve it to the current backing buffer at draw time and invalidate cached bindings when [generation](#generation) changes.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new DynamicBuffer**(`device`, `props`): `DynamicBuffer`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:81

Creates a dynamic buffer and its initial backing Buffer.

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`DynamicBufferProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/DynamicBufferProps.md)

#### Returns[​](#returns "Direct link to Returns")

`DynamicBuffer`

## Properties[​](#properties "Direct link to Properties")

### debugData[​](#debugdata "Direct link to debugData")

> **debugData**: `ArrayBuffer`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:65

Optional CPU-side mirror of recent writes and readbacks for debugging.

***

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:59

Whether [destroy](#destroy) has been called.

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:47

Device that owns the backing buffer.

***

### generation[​](#generation "Direct link to generation")

> **generation**: `number`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:61

Monotonic version that increments whenever the backing buffer is replaced.

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:49

Application-provided or generated identifier.

***

### isReady[​](#isready "Direct link to isReady")

> **isReady**: `boolean`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:57

Dynamic buffers are synchronously ready after construction.

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Readonly`<[`DynamicBufferProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/DynamicBufferProps.md)>

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:55

Normalized buffer props reused when the backing buffer is recreated.

***

### ready[​](#ready "Direct link to ready")

> `readonly` **ready**: `Promise`<`Buffer`>

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:51

Ready promise provided for compatibility with other dynamic resources.

***

### updateTimestamp[​](#updatetimestamp "Direct link to updateTimestamp")

> **updateTimestamp**: `number`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:63

Last update timestamp for writes, reads that populate debug data, or resize operations.

***

### usage[​](#usage "Direct link to usage")

> `readonly` **usage**: `number`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:53

Usage flags applied to every backing buffer created by this wrapper.

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:75

String tag used by `Object.prototype.toString`.

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### buffer[​](#buffer "Direct link to buffer")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **buffer**(): `Buffer`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:71

Current immutable core buffer backing this dynamic wrapper.

##### Returns[​](#returns-2 "Direct link to Returns")

`Buffer`

***

### byteLength[​](#bytelength "Direct link to byteLength")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **byteLength**(): `number`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:73

Current byte length of the backing buffer.

##### Returns[​](#returns-3 "Direct link to Returns")

`number`

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:145

Destroys the current backing buffer and clears debug data.

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### ensureSize()[​](#ensuresize "Direct link to ensureSize()")

> **ensureSize**(`byteLength`, `options?`): `boolean`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:132

Grows the backing buffer when the requested size exceeds the current size.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### byteLength[​](#bytelength-1 "Direct link to byteLength")

`number`

Minimum required byte length.

##### options?[​](#options "Direct link to options?")

###### preserveData?[​](#preservedata "Direct link to preserveData?")

`boolean`

Copies existing bytes when growth is required.

#### Returns[​](#returns-5 "Direct link to Returns")

`boolean`

`true` when the backing buffer grew.

***

### getBinding()[​](#getbinding "Direct link to getBinding()")

> **getBinding**(`range?`): `Binding`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:140

Returns the current backing buffer or a range binding over it.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### range?[​](#range "Direct link to range?")

Optional byte range for uniform/storage buffer bindings.

###### offset?[​](#offset "Direct link to offset?")

`number`

###### size?[​](#size "Direct link to size?")

`number`

#### Returns[​](#returns-6 "Direct link to Returns")

`Binding`

***

### mapAndReadAsync()[​](#mapandreadasync "Direct link to mapAndReadAsync()")

> **mapAndReadAsync**<`T`>(`callback`, `byteOffset?`, `byteLength?`): `Promise`<`T`>

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:111

Maps the current backing buffer for reading.

#### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

##### T[​](#t "Direct link to T")

`T`

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### callback[​](#callback "Direct link to callback")

`BufferMapCallback`<`T`>

Callback invoked with the mapped range.

##### byteOffset?[​](#byteoffset "Direct link to byteOffset?")

`number`

Byte offset of the mapped range.

##### byteLength?[​](#bytelength-2 "Direct link to byteLength?")

`number`

Byte length of the mapped range.

#### Returns[​](#returns-7 "Direct link to Returns")

`Promise`<`T`>

***

### mapAndWriteAsync()[​](#mapandwriteasync "Direct link to mapAndWriteAsync()")

> **mapAndWriteAsync**(`callback`, `byteOffset?`, `byteLength?`): `Promise`<`void`>

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:96

Maps the current backing buffer for writing and mirrors the written range when debug data is enabled.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### callback[​](#callback-1 "Direct link to callback")

`BufferMapCallback`<`void` | `Promise`<`void`>>

Callback invoked with the mapped range.

##### byteOffset?[​](#byteoffset-1 "Direct link to byteOffset?")

`number`

Byte offset of the mapped range.

##### byteLength?[​](#bytelength-3 "Direct link to byteLength?")

`number`

Byte length of the mapped range.

#### Returns[​](#returns-8 "Direct link to Returns")

`Promise`<`void`>

***

### readAsync()[​](#readasync "Direct link to readAsync()")

> **readAsync**(`byteOffset?`, `byteLength?`): `Promise`<`Uint8Array`<`ArrayBufferLike`>>

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:103

Reads bytes from the current backing buffer.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### byteOffset?[​](#byteoffset-2 "Direct link to byteOffset?")

`number`

Source byte offset in the backing buffer.

##### byteLength?[​](#bytelength-4 "Direct link to byteLength?")

`number`

Number of bytes to read.

#### Returns[​](#returns-9 "Direct link to Returns")

`Promise`<`Uint8Array`<`ArrayBufferLike`>>

***

### resize()[​](#resize "Direct link to resize()")

> **resize**(`options`): `boolean`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:120

Replaces the backing buffer with a new size.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### options[​](#options-1 "Direct link to options")

###### byteLength[​](#bytelength-5 "Direct link to byteLength")

`number`

New backing buffer byte length.

###### copyByteLength?[​](#copybytelength "Direct link to copyByteLength?")

`number`

Maximum number of bytes to copy when preserving data.

###### preserveData?[​](#preservedata-1 "Direct link to preserveData?")

`boolean`

Copies bytes from the old buffer into the new buffer.

#### Returns[​](#returns-10 "Direct link to Returns")

`boolean`

`true` when a new backing buffer was created.

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:79

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-11 "Direct link to Returns")

`string`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:77

Human-readable debug string.

#### Returns[​](#returns-12 "Direct link to Returns")

`string`

***

### write()[​](#write "Direct link to write()")

> **write**(`data`, `byteOffset?`): `void`

Defined in: modules/core/dist/dynamic/dynamic-buffer/dynamic-buffer.d.ts:88

Writes bytes into the current backing buffer.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### data[​](#data "Direct link to data")

`ArrayBuffer` | `SharedArrayBuffer` | `ArrayBufferView`<`ArrayBufferLike`>

Bytes or typed-array view to upload.

##### byteOffset?[​](#byteoffset-3 "Direct link to byteOffset?")

`number`

Destination byte offset in the backing buffer.

#### Returns[​](#returns-13 "Direct link to Returns")

`void`
