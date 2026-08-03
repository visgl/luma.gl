# Class: ShaderBlockWriter

Defined in: [modules/core/src/portable/shader-block-writer.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L22)

Serializes nested JavaScript uniform values according to a [ShaderBlockLayout](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md).

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ShaderBlockWriter**(`layout`): `ShaderBlockWriter`

Defined in: [modules/core/src/portable/shader-block-writer.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L29)

Creates a writer for a precomputed shader-block layout.

#### Parameters[​](#parameters "Direct link to Parameters")

##### layout[​](#layout "Direct link to layout")

[`ShaderBlockLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md)

#### Returns[​](#returns "Direct link to Returns")

`ShaderBlockWriter`

## Properties[​](#properties "Direct link to Properties")

### layout[​](#layout-1 "Direct link to layout")

> `readonly` **layout**: [`ShaderBlockLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md)

Defined in: [modules/core/src/portable/shader-block-writer.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L24)

Layout metadata used to flatten and serialize values.

## Methods[​](#methods "Direct link to Methods")

### get()[​](#get "Direct link to get()")

> **get**(`name`): { `offset`: `number`; `size`: `number`; } | `undefined`

Defined in: [modules/core/src/portable/shader-block-writer.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L43)

Returns offset and size metadata for a flattened field.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### name[​](#name "Direct link to name")

`string`

#### Returns[​](#returns-1 "Direct link to Returns")

{ `offset`: `number`; `size`: `number`; } | `undefined`

***

### getData()[​](#getdata "Direct link to getData()")

> **getData**(`uniformValues`): `Uint8Array`

Defined in: [modules/core/src/portable/shader-block-writer.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L77)

Serializes the supplied values into buffer-backed binary data.

The returned view length matches [ShaderBlockLayout.byteLength](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderBlockLayout.md#bytelength), which is the exact packed size of the block.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### uniformValues[​](#uniformvalues "Direct link to uniformValues")

`Readonly`<`Record`<`string`, [`CompositeUniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompositeUniformValue.md)>>

#### Returns[​](#returns-2 "Direct link to Returns")

`Uint8Array`

***

### getFlatUniformValues()[​](#getflatuniformvalues "Direct link to getFlatUniformValues()")

> **getFlatUniformValues**(`uniformValues`): `Record`<`string`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)>

Defined in: [modules/core/src/portable/shader-block-writer.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L54)

Flattens nested composite values into leaf-path values understood by [UniformBlock](https://luma.gl/next/docs/api-reference/generated/core/classes/UniformBlock.md).

Top-level values may be supplied either in nested object form matching the declared composite shader types or as already-flattened leaf-path values.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### uniformValues[​](#uniformvalues-1 "Direct link to uniformValues")

`Readonly`<`Record`<`string`, [`CompositeUniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompositeUniformValue.md)>>

#### Returns[​](#returns-3 "Direct link to Returns")

`Record`<`string`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)>

***

### has()[​](#has "Direct link to has()")

> **has**(`name`): `boolean`

Defined in: [modules/core/src/portable/shader-block-writer.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/shader-block-writer.ts#L36)

Returns `true` if the flattened layout contains the given field.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### name[​](#name-1 "Direct link to name")

`string`

#### Returns[​](#returns-4 "Direct link to Returns")

`boolean`
