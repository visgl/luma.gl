# Class: SwapBuffers

Defined in: [modules/engine/src/compute/swap.ts:121](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L121)

Helper for managing double-buffered GPU buffers

## Extends[​](#extends "Direct link to Extends")

* [`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md)<`Buffer`>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new SwapBuffers**(`device`, `props`): `SwapBuffers`

Defined in: [modules/engine/src/compute/swap.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L122)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

`BufferProps`

#### Returns[​](#returns "Direct link to Returns")

`SwapBuffers`

#### Overrides[​](#overrides "Direct link to Overrides")

[`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### current[​](#current "Direct link to current")

> **current**: `Buffer`

Defined in: [modules/engine/src/compute/swap.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L18)

The current resource - usually the source for renders or computations

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md).[`current`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md#current)

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/engine/src/compute/swap.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L15)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md).[`id`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md#id)

***

### next[​](#next "Direct link to next")

> **next**: `Buffer`

Defined in: [modules/engine/src/compute/swap.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L20)

The next resource - usually the target/destination for transforms / computations

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md).[`next`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md#next)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/compute/swap.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L29)

Destroys the two managed resources

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md#destroy)

***

### resize()[​](#resize "Direct link to resize()")

> **resize**(`props`): `boolean`

Defined in: [modules/engine/src/compute/swap.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L131)

Resizes the Buffers.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

###### byteLength[​](#bytelength "Direct link to byteLength")

`number`

#### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

true if the size changed, otherwise exiting buffers were preserved.

#### Note[​](#note "Direct link to Note")

any contents are not preserved!

***

### swap()[​](#swap "Direct link to swap()")

> **swap**(): `void`

Defined in: [modules/engine/src/compute/swap.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L35)

Make the next resource into the current resource, and reuse the current resource as the next resource

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`Swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md).[`swap`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Swap.md#swap)
