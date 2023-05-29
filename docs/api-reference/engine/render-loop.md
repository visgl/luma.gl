# AnimationLoopTemplate

> The luma.gl v9 API is currently in [public review](/docs/public-review).

`AnimationLoopTemplate` is a helper class that manages the applications render loop.
provides a number of conveniences related to initialization of a `Device` 
and update of per-frame animation parameters.

It is a wrapper of the [`AnimationLoop`](./animation-loop) class that is easier
to work with in TypeScript.

## Usage

```typescript
import {AnimationLoopTemplate} from `@luma.gl/engine`;
```

Autocreates a canvas/context

```typescript
import {AnimationLoopTemplate, ClipSpace} from '@luma.gl/engine';

class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  clipSpaceQuad: ClipSpace;

  constructor({device) {
    // Keys in the object returned here will be available in onRender
    this.clipSpaceQuad = new ClipSpace({gl, fs: FRAGMENT_SHADER});
  }

  override onFinalize() {
    this.clipSpaceQuad.destroy();
  }

  override onRender({tick}) {
    // Tick is auto updated by AnimationLoopTemplate
    this.clipSpaceQuad.setUniforms({uTime: tick * 0.01});
    this.clipSpaceQuad.draw();
  }
});

new AppAnimationLoopTemplate().start();
```

Use a canvas in the existing DOM through its HTML id

```typescript
new AppAnimationLoopTemplate({canvas: 'my-canvas'}).start();
```

## Types

### `AnimationLoopTemplateProps`

| Parameter                        | Type                    | Description                                                                                                                                                                 |
| -------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `device?`                            | `Device` | If supplied, will render into this external context instead of creating a new one.                                                                                          |
| `glOptions`=`{}` (object)        |                         | Options to create the WebGLContext with. See [createGLContext](/docs/api-reference-v8/webgl-legacy/context/context-api).                                                                        |
| `onCreateContext?`               | (callback)              | function without parameters that returns a `WebGLRenderingContext`. This callback will be called exactly once, after page load completes.                                   |
| `onInitialize`                   | (callback)              | if supplied, will be called once after first `start()` has been called, after page load completes and a context has been created.                                           |
| `onRender?`                      | (callback)              | Called on every animation frame.                                                                                                                                            |
| `onFinalize?`                    | (callback)              | Called once when animation is stopped. Can be used to delete objects or free any resources created during `onInitialize`.                                                   |
| `onError?`                       | (callback)              | Called when an error is about to be thrown.                                                                                                                                 |
| `autoResizeViewport`=`true`      | `boolean`               | If true, calls `gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)` each frame before `onRender` is called. Set to false to control viewport size.            |
| `autoResizeDrawingBuffer`=`true` | `boolean`               | If true, checks the canvas size every frame and updates the drawing buffer size if needed.                                                                                  |
| `useDevicePixels`                | `boolean \| number`     | Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc. Refer to `Experimental API` section below for more use cases of this prop. |

### `AnimationProps`

The callbacks `onInitialize`, `onRender` and `onFinalize` that the app supplies to the `AnimationLoopTemplate`, will be called with an object containing named parameters:

| Parameter         | Type                                     | Description                                                                         |
| ----------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `animationLoop`  | `AnimationLoopTemplate`                          |  The calling `AnimationLoopTemplate` instance                             |
| `device`          | `Device`                  | This `AnimationLoopTemplate`'s gl context.                                                  |
| `canvas`          | `HTMLCanvasElement` or `OffscreenCanvas` | The canvas associated with this context.                                            |
| `aspect`          | `number`                                         | The canvas aspect ratio (width/height) to update projection matrices                |
| `width`           |                                          | The drawing buffer width, in "device" pixels (can be different from canvas.width).  |
| `height`          |                                          | The drawing buffer height, in "device" pixels (can be different from canvas.width). |
| `useDevicePixels` | `boolean`                                         | Boolean indicating if canvas is utilizes full resolution of Retina/                 |
| `needsRedraw`     | `String`                                 | Redraw flag (will be automatically set if drawingBuffer resizes)                    |
| `time`            | `Number`                                 | Milliseconds since `AnimationLoopTemplate` was created (monotonic).                         |
| `tick`            | `Number`                                 | Counter that updates for every frame rendered (monotonic).                          |
| `renderPass`      | `RenderPass`                            | Availabel if `createFrameBuffer: true` was passed to the constructor.               |
| `_mousePosition`  | `[x, y]` or `null`                       | (**experimental**) Current mouse position over the canvas.                          |
| `_timeline`       | `Timeline`                               | (**experimental**) `Timeline` object tracking the animation timeline and channels.  |

## Methods

### constructor(props: Object)

```typescript
new AnimationLoopTemplate({
  onCreateContext,
  onInitialize,
  onFinalize,
  onRender,
  autoResizeViewport,
  autoResizeDrawingBuffer
});
```

### start([options: Object]): AnimationLoopTemplate

Restarts the animation

`animationLoop.start(options)`

- `options`=`{}` (object) - Options to create the WebGLContext with. See [createGLContext](/docs/api-reference-v8/webgl-legacy/context/context-api).

### stop(): AnimationLoopTemplate

Stops the animation

`animationLoop.stop()`

### waitForRender(): Promise

Returns a promise which resolves in the next frame after rendering and the `onRender` callback have completed.

```typescript
const loop = await animationLoop.waitForRender()
// can now read pixels from webgl context
loop.gl.readPixels(...)
```

### redraw(): AnimationLoopTemplate

Immediately invokes a redraw (call `onRender` with updated animation props). Only use if the canvas must be updated synchronously.

### setNeedsRedraw(reason: String): AnimationLoopTemplate

`animationLoop.setNeedsRedraw(reason)`

- `reason` (`String`) - A human readable string giving a hint as to why redraw was needed (e.g. "geometry changed").

If set, the value will be provided as the `needsRedraw` field to the `onRender` callback.

Notes:

- `onRender` will be called for each animation frame regardless of whether this flag is set, and the redraw reason is automatically cleared.
- If called multiple times, the `reason` provided in the first call will be remembered.
- `AnimationLoopTemplate` automatically sets this flag if the WebGL context's drawing buffer size changes.

### setProps(props: Object): AnimationLoopTemplate

`animationLoop.setProps({...props})`

- `props.autoResizeViewport` - Call `gl.viewport` before each call to `onRender()`
- `props.autoResizeDrawingBuffer` - Update the drawing buffer size to match the canvas size before each call to `onRender()`
- `props.useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.

### attachTimeline(timeline: Timeline): void

Attach an `Timeline` object to the animation loop. Allows time produced for animations to be paused, played, etc. See `Timeline` documentation for more info.

### detachTimeline(): void

Detach the currently attached timeline from the animation loop.

### toDataURL(): string

Returns returns a `Promise` that resolves to the data URL of the canvas once drawing operations are complete for the current frame. The data URL can be used as the `src` for an HTML image element.

`animationLoop.toDataURL()`

### isContextLost(): boolean

Returns the current state of the WebGL context used by the animation loop.

### Frame timers

- The animation loop tracks GPU and CPU render time of each frame the in member properties `cpuTime` and `gpuTime`. If `gpuTime` is set to `-1`, then the timing for the last frame was invalid and should not be used (this rare and might occur, for example, if the GPU was throttled mid-frame).

## Experimental API (`useDevicePixels`)

`useDevicePixels` can accept a custom ratio (Number), instead of `true` or `false`. This allows rendering to a much smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down, this happens due to system memory limitation, in such cases a warning will be logged to the browser console. For additional details check device pixels [`document`](/docs/api-reference-v8/webgl-legacy/context/device-pixels).

## Remarks

- You can instantiate multiple `AnimationLoopTemplate` classes in parallel, rendering into the same or different `WebGLRenderingContext`s.
- Works both in browser and under Node.js.
- All `AnimationLoopTemplate` methods can be chained.
- Postpones context creation until the page (i.e. all HTML) has been loaded. At this time it is safe to specify canvas ids when calling [`createGLContext`](/docs/api-reference-v8/webgl-legacy/context/context-api).
- The supplied callback function must return a WebGLRenderingContext or an error will be thrown.
- This callback registration function should not be called if a `WebGLRenderingContext` was supplied to the AnimationLoopTemplate constructor.

- When running in the browser, this class uses [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html#drawingbuffer) contains excellent information on the subtleties of the how the WebGL context's drawing buffer and the HTML canvas interact.
