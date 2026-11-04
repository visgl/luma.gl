# Class: Swap\<T>

Defined in: [modules/engine/src/compute/swap.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L14)

Helper class for working with repeated transformations / computations Primarily intended for GPU buffers `Swap<Buffer>` or textures `Swap<Texture>`)

## Note[​](#note "Direct link to Note")

the two resources are expected to be structurally identical (same size, length, format, etc)

## Note[​](#note-1 "Direct link to Note")

the two resources can be destroyed by calling `destroy()`

## Extended by[​](#extended-by "Direct link to Extended by")

* [`SwapBuffers`](https://luma.gl/docs/api-reference/generated/engine/classes/SwapBuffers.md)
* [`SwapFramebuffers`](https://luma.gl/docs/api-reference/generated/engine/classes/SwapFramebuffers.md)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### T[​](#t "Direct link to T")

`T` *extends* `Resource`<`any`>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Swap**<`T`>(`props`): `Swap`<`T`>

Defined in: [modules/engine/src/compute/swap.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L22)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

###### current[​](#current "Direct link to current")

`T`

###### id?[​](#id "Direct link to id?")

`string`

###### next[​](#next "Direct link to next")

`T`

#### Returns[​](#returns "Direct link to Returns")

`Swap`<`T`>

## Properties[​](#properties "Direct link to Properties")

### current[​](#current-1 "Direct link to current")

> **current**: `T`

Defined in: [modules/engine/src/compute/swap.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L18)

The current resource - usually the source for renders or computations

***

### id[​](#id-1 "Direct link to id")

> **id**: `string`

Defined in: [modules/engine/src/compute/swap.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L15)

***

### next[​](#next-1 "Direct link to next")

> **next**: `T`

Defined in: [modules/engine/src/compute/swap.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L20)

The next resource - usually the target/destination for transforms / computations

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/compute/swap.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L29)

Destroys the two managed resources

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### swap()[​](#swap "Direct link to swap()")

> **swap**(): `void`

Defined in: [modules/engine/src/compute/swap.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/swap.ts#L35)

Make the next resource into the current resource, and reuse the current resource as the next resource

#### Returns[​](#returns-2 "Direct link to Returns")

`void`
