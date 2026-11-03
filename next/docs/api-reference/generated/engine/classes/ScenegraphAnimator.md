# Class: ScenegraphAnimator\<TClip>

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L13)

Playback policy shared by imported and programmatic scene animations.

## Extends[​](#extends "Direct link to Extends")

* [`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md)<`TClip`>

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TClip[​](#tclip "Direct link to TClip")

`TClip` *extends* [`ScenegraphAnimationClip`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphAnimationClip.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ScenegraphAnimator**<`TClip`>(`clips`, `mixer`, `options?`): `ScenegraphAnimator`<`TClip`>

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L19)

#### Parameters[​](#parameters "Direct link to Parameters")

##### clips[​](#clips "Direct link to clips")

`TClip`\[]

##### mixer[​](#mixer "Direct link to mixer")

[`AnimationMixer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationMixer.md)

##### options?[​](#options "Direct link to options?")

###### autoplay?[​](#autoplay "Direct link to autoplay?")

`false` | `"first"` | `"all"`

###### onUpdate?[​](#onupdate "Direct link to onUpdate?")

() => `void`

#### Returns[​](#returns "Direct link to Returns")

`ScenegraphAnimator`<`TClip`>

#### Overrides[​](#overrides "Direct link to Overrides")

[`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### activeClip[​](#activeclip "Direct link to activeClip")

> **activeClip**: `string` | `undefined`

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L15)

***

### animations[​](#animations "Direct link to animations")

> `readonly` **animations**: `TClip`\[]

Defined in: [modules/engine/src/animation/animator.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L55)

Compatibility alias for clip list.

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md).[`animations`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md#animations)

***

### clips[​](#clips-1 "Direct link to clips")

> `readonly` **clips**: `TClip`\[]

Defined in: [modules/engine/src/animation/animator.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L53)

Managed clip list.

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md).[`clips`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md#clips)

***

### mixer[​](#mixer-1 "Direct link to mixer")

> `readonly` **mixer**: [`AnimationMixer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationMixer.md)

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L14)

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

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md).[`animate`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md#animate)

***

### getAnimations()[​](#getanimations "Direct link to getAnimations()")

> **getAnimations**(): `TClip`\[]

Defined in: [modules/engine/src/animation/animator.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/animator.ts#L76)

Returns the managed animation clips.

#### Returns[​](#returns-2 "Direct link to Returns")

`TClip`\[]

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md).[`getAnimations`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md#getanimations)

***

### selectClip()[​](#selectclip "Direct link to selectClip()")

> **selectClip**(`name`, `options?`): `TClip`

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L76)

Selects one imported clip and optionally crossfades from the previous selection.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### name[​](#name "Direct link to name")

`string`

##### options?[​](#options-1 "Direct link to options?")

[`AnimationSelectionOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationSelectionOptions.md) = `{}`

#### Returns[​](#returns-3 "Direct link to Returns")

`TClip`

***

### setTime()[​](#settime "Direct link to setTime()")

> **setTime**(`timeMs`): `void`

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L46)

Resolves legacy wall-clock milliseconds while evaluating all clips in one mixer pass.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### timeMs[​](#timems-1 "Direct link to timeMs")

`number`

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Animator`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md).[`setTime`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Animator.md#settime)

***

### setUpdateHandler()[​](#setupdatehandler "Direct link to setUpdateHandler()")

> **setUpdateHandler**(`callback`): `this`

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L40)

Registers the dependent scenegraph update performed once after each animation frame.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### callback[​](#callback "Direct link to callback")

(() => `void`) | `undefined`

#### Returns[​](#returns-5 "Direct link to Returns")

`this`

***

### update()[​](#update "Direct link to update()")

> **update**(`deltaSeconds`): `void`

Defined in: [modules/engine/src/animation/scenegraph-animator.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation/scenegraph-animator.ts#L70)

Advances clips using delta seconds without converting the legacy millisecond clock.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### deltaSeconds[​](#deltaseconds "Direct link to deltaSeconds")

`number`

#### Returns[​](#returns-6 "Direct link to Returns")

`void`
