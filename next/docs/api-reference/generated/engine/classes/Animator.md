# Class: Animator\<TClip>

Defined in: [modules/engine/src/animation/animator.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L51)

Generic manager for a set of time-driven animation clips.

## Extended by[​](#extended-by "Direct link to Extended by")

* [`ScenegraphAnimator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ScenegraphAnimator.md)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TClip[​](#tclip "Direct link to TClip")

`TClip` *extends* [`AnimationClipController`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationClipController.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Animator**<`TClip`>(`clips`): `Animator`<`TClip`>

Defined in: [modules/engine/src/animation/animator.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L57)

#### Parameters[​](#parameters "Direct link to Parameters")

##### clips[​](#clips "Direct link to clips")

`TClip`\[]

#### Returns[​](#returns "Direct link to Returns")

`Animator`<`TClip`>

## Properties[​](#properties "Direct link to Properties")

### animations[​](#animations "Direct link to animations")

> `readonly` **animations**: `TClip`\[]

Defined in: [modules/engine/src/animation/animator.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L55)

Compatibility alias for clip list.

***

### clips[​](#clips-1 "Direct link to clips")

> `readonly` **clips**: `TClip`\[]

Defined in: [modules/engine/src/animation/animator.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L53)

Managed clip list.

## Methods[​](#methods "Direct link to Methods")

### ~~animate()~~[​](#animate "Direct link to animate")

> **animate**(`timeMs`): `void`

Defined in: [modules/engine/src/animation/animator.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L63)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### timeMs[​](#timems "Direct link to timeMs")

`number`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use .setTime().

***

### getAnimations()[​](#getanimations "Direct link to getAnimations()")

> **getAnimations**(): `TClip`\[]

Defined in: [modules/engine/src/animation/animator.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L76)

Returns the managed animation clips.

#### Returns[​](#returns-2 "Direct link to Returns")

`TClip`\[]

***

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`timeMs`): `void`

Defined in: [modules/engine/src/animation/animator.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L71)

Advances every clip to the supplied wall-clock time in milliseconds.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### timeMs[​](#timems-1 "Direct link to timeMs")

`number`

#### Returns[​](#returns-3 "Direct link to Returns")

`void`
