# Abstract Class: AnimationLoopTemplate

Defined in: [modules/engine/src/animation-loop/animation-loop-template.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop-template.ts#L22)

Minimal class that represents a "componentized" rendering life cycle (resource construction, repeated rendering, resource destruction)

## Note[​](#note "Direct link to Note")

A motivation for this class compared to the raw animation loop is that it simplifies TypeScript code by allowing resources to be typed unconditionally since they are allocated in the constructor rather than in onInitialized

## Note[​](#note-1 "Direct link to Note")

Introduced in luma.gl v9

## Example[​](#example "Direct link to Example")

```
AnimationLoopTemplate is intended to be subclassed,

but the subclass should not be instantiated directly. Instead the subclass

(i.e. the constructor of the subclass) should be used

as an argument to create an AnimationLoop.
```

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new AnimationLoopTemplate**(`animationProps?`): `AnimationLoopTemplate`

Defined in: [modules/engine/src/animation-loop/animation-loop-template.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop-template.ts#L23)

#### Parameters[​](#parameters "Direct link to Parameters")

##### animationProps?[​](#animationprops "Direct link to animationProps?")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns "Direct link to Returns")

`AnimationLoopTemplate`

## Methods[​](#methods "Direct link to Methods")

### onFinalize()[​](#onfinalize "Direct link to onFinalize()")

> `abstract` **onFinalize**(`animationProps`): `void`

Defined in: [modules/engine/src/animation-loop/animation-loop-template.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop-template.ts#L28)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### animationProps[​](#animationprops-1 "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### onInitialize()[​](#oninitialize "Direct link to onInitialize()")

> **onInitialize**(`animationProps`): `Promise`<`unknown`>

Defined in: [modules/engine/src/animation-loop/animation-loop-template.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop-template.ts#L24)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### animationProps[​](#animationprops-2 "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`Promise`<`unknown`>

***

### onRender()[​](#onrender "Direct link to onRender()")

> `abstract` **onRender**(`animationProps`): `unknown`

Defined in: [modules/engine/src/animation-loop/animation-loop-template.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/animation-loop-template.ts#L27)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### animationProps[​](#animationprops-3 "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`unknown`
