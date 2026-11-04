# Type Alias: AnimationLoopProps

> **AnimationLoopProps** = `object`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L32)

AnimationLoop properties

## Properties[​](#properties "Direct link to Properties")

### animationFrameProvider?[​](#animationframeprovider "Direct link to animationFrameProvider?")

> `optional` **animationFrameProvider?**: [`AnimationFrameProvider`](https://luma.gl/docs/api-reference/generated/engine/interfaces/AnimationFrameProvider.md)

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L50)

Experimental v10 work-in-progress frame source.

***

### autoResizeViewport?[​](#autoresizeviewport "Direct link to autoResizeViewport?")

> `optional` **autoResizeViewport?**: `boolean`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L48)

***

### device[​](#device "Direct link to device")

> **device**: `Device` | `Promise`<`Device`>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L33)

***

### mobileQuality?[​](#mobilequality "Direct link to mobileQuality?")

> `optional` **mobileQuality?**: `Readonly`<`Record`<`string`, `boolean` | `number`>>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L36)

Optional application-provided quality settings for adaptive renderers.

***

### onAddHTML?[​](#onaddhtml "Direct link to onAddHTML?")

> `optional` **onAddHTML?**: (`div`) => `string`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L38)

#### Parameters[​](#parameters "Direct link to Parameters")

##### div[​](#div "Direct link to div")

`HTMLDivElement`

#### Returns[​](#returns "Direct link to Returns")

`string`

***

### onError?[​](#onerror "Direct link to onError?")

> `optional` **onError?**: (`reason`) => `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L43)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### reason[​](#reason "Direct link to reason")

`Error`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### onFinalize?[​](#onfinalize "Direct link to onFinalize?")

> `optional` **onFinalize?**: (`animationProps`) => `void`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L42)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### animationProps[​](#animationprops "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### onInitialize?[​](#oninitialize "Direct link to onInitialize?")

> `optional` **onInitialize?**: (`animationProps`) => `Promise`<`unknown`>

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L39)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### animationProps[​](#animationprops-1 "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`Promise`<`unknown`>

***

### onRender?[​](#onrender "Direct link to onRender?")

> `optional` **onRender?**: (`animationProps`) => `unknown`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L41)

Encode a frame. Return false when no GPU work was encoded to skip device submission.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### animationProps[​](#animationprops-2 "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`unknown`

***

### stats?[​](#stats "Direct link to stats?")

> `optional` **stats?**: `Stats`

Defined in: [modules/engine/src/animation-loop/animation-loop.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop.ts#L45)
