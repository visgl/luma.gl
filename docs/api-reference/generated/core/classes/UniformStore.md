# Class: UniformStore\<TPropGroups>

Defined in: [modules/core/src/portable/uniform-store.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L52)

A uniform store holds a uniform values for one or more uniform blocks,

* It can generate binary data for any uniform buffer
* It can manage a uniform buffer for each block
* It can update managed uniform buffers with a single call
* It performs some book keeping on what has changed to minimize unnecessary writes to uniform buffers.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TPropGroups[​](#tpropgroups "Direct link to TPropGroups")

`TPropGroups` *extends* `Record`<`string`, `Record`<`string`, `unknown`>> = `Record`<`string`, `Record`<`string`, `unknown`>>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new UniformStore**<`TPropGroups`>(`device`, `blocks`): `UniformStore`<`TPropGroups`>

Defined in: [modules/core/src/portable/uniform-store.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L72)

Creates a new UniformStore for the supplied device and block definitions.

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

##### blocks[​](#blocks "Direct link to blocks")

`UniformStoreBlocks`<`TPropGroups`>

#### Returns[​](#returns "Direct link to Returns")

`UniformStore`<`TPropGroups`>

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: [`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/portable/uniform-store.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L59)

Device used to infer layout and allocate buffers.

***

### shaderBlockLayouts[​](#shaderblocklayouts "Direct link to shaderBlockLayouts")

> **shaderBlockLayouts**: `Map`\<keyof `TPropGroups`, [`ShaderBlockLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md)>

Defined in: [modules/core/src/portable/uniform-store.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L63)

Flattened layout metadata for each block.

***

### shaderBlockWriters[​](#shaderblockwriters "Direct link to shaderBlockWriters")

> **shaderBlockWriters**: `Map`\<keyof `TPropGroups`, [`ShaderBlockWriter`](https://luma.gl/docs/api-reference/generated/core/classes/ShaderBlockWriter.md)>

Defined in: [modules/core/src/portable/uniform-store.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L65)

Serializers for block-backed uniform data.

***

### uniformBlocks[​](#uniformblocks "Direct link to uniformBlocks")

> **uniformBlocks**: `Map`\<keyof `TPropGroups`, [`UniformBlock`](https://luma.gl/docs/api-reference/generated/core/classes/UniformBlock.md)<`Record`<`string`, [`UniformValue`](https://luma.gl/docs/api-reference/generated/core/type-aliases/UniformValue.md)>>>

Defined in: [modules/core/src/portable/uniform-store.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L61)

Stores the uniform values for each uniform block

***

### uniformBuffers[​](#uniformbuffers "Direct link to uniformBuffers")

> **uniformBuffers**: `Map`\<keyof `TPropGroups`, [`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)>

Defined in: [modules/core/src/portable/uniform-store.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L67)

Actual buffer for the blocks

## Methods[​](#methods "Direct link to Methods")

### createUniformBuffer()[​](#createuniformbuffer "Direct link to createUniformBuffer()")

> **createUniformBuffer**(`uniformBufferName`, `uniforms?`): [`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

Defined in: [modules/core/src/portable/uniform-store.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L153)

Creates an unmanaged uniform buffer initialized with the current or supplied values.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### uniformBufferName[​](#uniformbuffername "Direct link to uniformBufferName")

keyof `TPropGroups`

##### uniforms?[​](#uniforms "Direct link to uniforms?")

`Partial`<{ \[group in string | number | symbol]: Partial\<TPropGroups\[group]> }>

#### Returns[​](#returns-1 "Direct link to Returns")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/portable/uniform-store.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L94)

Destroy any managed uniform buffers

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### getManagedUniformBuffer()[​](#getmanageduniformbuffer "Direct link to getManagedUniformBuffer()")

> **getManagedUniformBuffer**(`uniformBufferName`): [`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

Defined in: [modules/core/src/portable/uniform-store.ts:172](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L172)

Returns the managed uniform buffer for the named block.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### uniformBufferName[​](#uniformbuffername-1 "Direct link to uniformBufferName")

keyof `TPropGroups`

#### Returns[​](#returns-3 "Direct link to Returns")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

***

### getUniformBufferByteLength()[​](#getuniformbufferbytelength "Direct link to getUniformBufferByteLength()")

> **getUniformBufferByteLength**(`uniformBufferName`): `number`

Defined in: [modules/core/src/portable/uniform-store.ts:133](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L133)

Returns the allocation size for the named uniform buffer.

This may exceed the packed layout size because minimum buffer-size policy is applied at the store layer.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### uniformBufferName[​](#uniformbuffername-2 "Direct link to uniformBufferName")

keyof `TPropGroups`

#### Returns[​](#returns-4 "Direct link to Returns")

`number`

***

### getUniformBufferData()[​](#getuniformbufferdata "Direct link to getUniformBufferData()")

> **getUniformBufferData**(`uniformBufferName`): `Uint8Array`

Defined in: [modules/core/src/portable/uniform-store.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L144)

Returns packed binary data that can be uploaded to the named uniform buffer.

The returned view length matches the packed block size and is not padded to the store's minimum allocation size.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### uniformBufferName[​](#uniformbuffername-3 "Direct link to uniformBufferName")

keyof `TPropGroups`

#### Returns[​](#returns-5 "Direct link to Returns")

`Uint8Array`

***

### setUniforms()[​](#setuniforms "Direct link to setUniforms()")

> **setUniforms**(`uniforms`, `commandEncoder?`): `void`

Defined in: [modules/core/src/portable/uniform-store.ts:109](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L109)

Set uniforms

Makes all group properties partial and eagerly propagates changes to any managed GPU buffers.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### uniforms[​](#uniforms-1 "Direct link to uniforms")

`Partial`<`{ [group in keyof TPropGroups]: Partial<TPropGroups[group]> }`>

##### commandEncoder?[​](#commandencoder "Direct link to commandEncoder?")

[`CommandEncoder`](https://luma.gl/docs/api-reference/generated/core/classes/CommandEncoder.md)

Optional encoder used to order managed uniform uploads with later GPU work in the same submission.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### updateUniformBuffer()[​](#updateuniformbuffer "Direct link to updateUniformBuffer()")

> **updateUniformBuffer**(`uniformBufferName`, `commandEncoder?`): `string` | `false`

Defined in: [modules/core/src/portable/uniform-store.ts:212](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L212)

Updates one managed uniform buffer if its corresponding block is dirty.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### uniformBufferName[​](#uniformbuffername-4 "Direct link to uniformBufferName")

keyof `TPropGroups`

##### commandEncoder?[​](#commandencoder-1 "Direct link to commandEncoder?")

[`CommandEncoder`](https://luma.gl/docs/api-reference/generated/core/classes/CommandEncoder.md)

Optional encoder used to record the upload instead of writing the buffer immediately.

#### Returns[​](#returns-7 "Direct link to Returns")

`string` | `false`

The redraw reason for the update, or `false` if no write occurred.

***

### updateUniformBuffers()[​](#updateuniformbuffers "Direct link to updateUniformBuffers()")

> **updateUniformBuffers**(`commandEncoder?`): `string` | `false`

Defined in: [modules/core/src/portable/uniform-store.ts:193](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-store.ts#L193)

Updates every managed uniform buffer whose source uniforms have changed.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### commandEncoder?[​](#commandencoder-2 "Direct link to commandEncoder?")

[`CommandEncoder`](https://luma.gl/docs/api-reference/generated/core/classes/CommandEncoder.md)

Optional encoder used to record ordered uploads for changed uniform buffers.

#### Returns[​](#returns-8 "Direct link to Returns")

`string` | `false`

The first redraw reason encountered, or `false` if nothing changed.
