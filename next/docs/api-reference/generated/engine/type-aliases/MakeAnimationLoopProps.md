# Type Alias: MakeAnimationLoopProps

> **MakeAnimationLoopProps** = `Omit`<[`AnimationLoopProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationLoopProps.md), `"onCreateDevice"` | `"onInitialize"` | `"onRedraw"` | `"onFinalize"`> & `object`

Defined in: [modules/engine/src/animation-loop/make-animation-loop.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/make-animation-loop.ts#L11)

Props accepted while constructing an animation loop from a template.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### adapters?[​](#adapters "Direct link to adapters?")

> `optional` **adapters?**: `Adapter`\[]

List of adapters to use when creating the device

### onAfterRender?[​](#onafterrender "Direct link to onAfterRender?")

> `optional` **onAfterRender?**: (`animationProps`, `animationLoopTemplate`) => `unknown`

Runs after the template has encoded its frame and before the animation loop submits it.

#### Parameters[​](#parameters "Direct link to Parameters")

##### animationProps[​](#animationprops "Direct link to animationProps")

[`AnimationProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/AnimationProps.md)

##### animationLoopTemplate[​](#animationlooptemplate "Direct link to animationLoopTemplate")

[`AnimationLoopTemplate`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationLoopTemplate.md) | `null`

#### Returns[​](#returns "Direct link to Returns")

`unknown`
