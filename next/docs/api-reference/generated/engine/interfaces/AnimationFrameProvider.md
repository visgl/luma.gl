# Interface: AnimationFrameProvider

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L21)

Experimental v10 work-in-progress animation frame source.

## Methods[​](#methods "Direct link to Methods")

### cancelAnimationFrame()[​](#cancelanimationframe "Direct link to cancelAnimationFrame()")

> **cancelAnimationFrame**(`animationFrameId`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L23)

#### Parameters[​](#parameters "Direct link to Parameters")

##### animationFrameId[​](#animationframeid "Direct link to animationFrameId")

`number`

#### Returns[​](#returns "Direct link to Returns")

`void`

***

### requestAnimationFrame()[​](#requestanimationframe "Direct link to requestAnimationFrame()")

> **requestAnimationFrame**(`callback`): `number`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L22)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### callback[​](#callback "Direct link to callback")

[`AnimationFrameCallback`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationFrameCallback.md)

#### Returns[​](#returns-1 "Direct link to Returns")

`number`
