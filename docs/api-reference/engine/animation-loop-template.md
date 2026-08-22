import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# AnimationLoopTemplate

<EngineDocsTabs group="animation" active="animation-loop-template" />

`AnimationLoopTemplate` is a small abstract base class for applications that prefer a class-based render lifecycle on top of [`AnimationLoop`](/docs/api-reference/engine/animation-loop).

The main motivation is TypeScript ergonomics: GPU resources can be created in the constructor and stored on the subclass as non-null fields, instead of being initialized later inside callback functions.

## Usage

```typescript
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

## Types

### `MakeAnimationLoopProps`

```ts
`MakeAnimationLoopProps` accepts either a supplied `device`, or `adapters` plus `deviceProps` for
automatic creation. The two forms are mutually exclusive. `deviceProps` forwards backend policy,
feature level, power preference, optional features, canvas configuration, and callbacks to
`luma.createDevice()`.
```

If `device` is omitted, `makeAnimationLoop()` creates or resolves the HTML canvas before starting
device creation. This lets the default `errorDisplay` report adapter, device, or canvas failures in
the intended canvas area even on mobile devices without developer tools.

## Methods

### `constructor(animationProps?: AnimationProps)`

The subclass constructor receives the same `AnimationProps` object that `AnimationLoop` passes to lifecycle callbacks.

### `onInitialize(animationProps: AnimationProps): Promise<unknown>`

Optional async setup hook. The base implementation returns `null`.

### `onRender(animationProps: AnimationProps): unknown`

Required render callback implemented by subclasses.

### `onFinalize(animationProps: AnimationProps): void`

Required teardown callback implemented by subclasses.

## Functions

### `makeAnimationLoop(AnimationLoopTemplateCtor, props?): AnimationLoop`

Wraps an `AnimationLoopTemplate` subclass in an [`AnimationLoop`](/docs/api-reference/engine/animation-loop).

- Forwards most props to `AnimationLoop`.
- Creates a device automatically when `props.device` is omitted.
- Instantiates the template during `onInitialize`.

## Remarks

- `AnimationLoopTemplate` is abstract and should not be constructed directly.
- Keep `makeAnimationLoop()` and `AnimationLoopTemplate` together conceptually: the function is the supported way to turn the template into a running render loop.
