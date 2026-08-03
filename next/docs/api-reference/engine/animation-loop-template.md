# AnimationLoopTemplate

[AnimationLoop](https://luma.gl/next/docs/api-reference/engine/animation-loop.md)[Template](https://luma.gl/next/docs/api-reference/engine/animation-loop-template.md)[KeyFrames](https://luma.gl/next/docs/api-reference/engine/animation/key-frames.md)[Timeline](https://luma.gl/next/docs/api-reference/engine/animation/timeline.md)

`AnimationLoopTemplate` is a small abstract base class for applications that prefer a class-based render lifecycle on top of [`AnimationLoop`](https://luma.gl/next/docs/api-reference/engine/animation-loop.md).

The main motivation is TypeScript ergonomics: GPU resources can be created in the constructor and stored on the subclass as non-null fields, instead of being initialized later inside callback functions.

## Usage[​](#usage "Direct link to Usage")

```
import {AnimationLoopTemplate, ClipSpace, makeAnimationLoop} from '@luma.gl/engine';

class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  clipSpaceQuad: ClipSpace;

  constructor(animationProps) {
    super(animationProps);
    this.clipSpaceQuad = new ClipSpace(animationProps.device, {fs: FRAGMENT_SHADER});
  }

  onRender({device, canvasContext}) {
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const renderPass = device.beginRenderPass({framebuffer});
    this.clipSpaceQuad.draw(renderPass);
    renderPass.end();
  }

  onFinalize() {
    this.clipSpaceQuad.destroy();
  }
}

const animationLoop = makeAnimationLoop(AppAnimationLoopTemplate);
await animationLoop.start();
```

## Types[​](#types "Direct link to Types")

### `MakeAnimationLoopProps`[​](#makeanimationloopprops "Direct link to makeanimationloopprops")

```
export type MakeAnimationLoopProps = Omit<
  AnimationLoopProps,
  'onCreateDevice' | 'onInitialize' | 'onRedraw' | 'onFinalize'
> & {
  adapters?: Adapter[];
};
```

If `device` is omitted, `makeAnimationLoop()` creates one with `luma.createDevice({adapters, createCanvasContext: true})`.

## Methods[​](#methods "Direct link to Methods")

### `constructor(animationProps?: AnimationProps)`[​](#constructoranimationprops-animationprops "Direct link to constructoranimationprops-animationprops")

The subclass constructor receives the same `AnimationProps` object that `AnimationLoop` passes to lifecycle callbacks.

### `onInitialize(animationProps: AnimationProps): Promise<unknown>`[​](#oninitializeanimationprops-animationprops-promiseunknown "Direct link to oninitializeanimationprops-animationprops-promiseunknown")

Optional async setup hook. The base implementation returns `null`.

### `onRender(animationProps: AnimationProps): unknown`[​](#onrenderanimationprops-animationprops-unknown "Direct link to onrenderanimationprops-animationprops-unknown")

Required render callback implemented by subclasses.

### `onFinalize(animationProps: AnimationProps): void`[​](#onfinalizeanimationprops-animationprops-void "Direct link to onfinalizeanimationprops-animationprops-void")

Required teardown callback implemented by subclasses.

## Functions[​](#functions "Direct link to Functions")

### `makeAnimationLoop(AnimationLoopTemplateCtor, props?): AnimationLoop`[​](#makeanimationloopanimationlooptemplatector-props-animationloop "Direct link to makeanimationloopanimationlooptemplatector-props-animationloop")

Wraps an `AnimationLoopTemplate` subclass in an [`AnimationLoop`](https://luma.gl/next/docs/api-reference/engine/animation-loop.md).

* Forwards most props to `AnimationLoop`.
* Creates a device automatically when `props.device` is omitted.
* Instantiates the template during `onInitialize`.

## Remarks[​](#remarks "Direct link to Remarks")

* `AnimationLoopTemplate` is abstract and should not be constructed directly.
* Keep `makeAnimationLoop()` and `AnimationLoopTemplate` together conceptually: the function is the supported way to turn the template into a running render loop.
