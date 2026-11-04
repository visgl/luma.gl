# Function: makeAnimationLoop()

> **makeAnimationLoop**(`AnimationLoopTemplateCtor`, `props?`): [`TemplateAnimationLoop`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TemplateAnimationLoop.md)

Defined in: [modules/engine/src/animation-loop/make-animation-loop.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/animation-loop/make-animation-loop.ts#L34)

Instantiates an animation loop and initializes it with the template.

## Parameters[​](#parameters "Direct link to Parameters")

### AnimationLoopTemplateCtor[​](#animationlooptemplatector "Direct link to AnimationLoopTemplateCtor")

*typeof* [`AnimationLoopTemplate`](https://luma.gl/docs/api-reference/generated/engine/classes/AnimationLoopTemplate.md)

### props?[​](#props "Direct link to props?")

[`MakeAnimationLoopProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MakeAnimationLoopProps.md)

## Returns[​](#returns "Direct link to Returns")

[`TemplateAnimationLoop`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TemplateAnimationLoop.md)

## Note[​](#note "Direct link to Note")

The application needs to call `start()` on the returned animation loop to start the rendering loop.
