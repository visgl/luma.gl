# Type Alias: TemplateAnimationLoop

> **TemplateAnimationLoop** = [`AnimationLoop`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationLoop.md) & `object`

Defined in: [modules/engine/src/animation-loop/make-animation-loop.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/make-animation-loop.ts#L25)

Animation loop created from a template, with access to the active template instance.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### getAnimationLoopTemplate()[​](#getanimationlooptemplate "Direct link to getAnimationLoopTemplate()")

> **getAnimationLoopTemplate**(): [`AnimationLoopTemplate`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationLoopTemplate.md) | `null`

Returns the template after initialization, or null before initialization and after failure.

#### Returns[​](#returns "Direct link to Returns")

[`AnimationLoopTemplate`](https://luma.gl/next/docs/api-reference/generated/engine/classes/AnimationLoopTemplate.md) | `null`
