# AnimationLoop

Manages an animation loop and optionally a WebGL context and a WebGL canvas. It provides a number of features related to initialization and animation of a WebGL context.

* Provides a number of commonly needed variables as part of the `context` object which is passed to `onRender` and `onFinalize` callbacks.
* Objects returned by `onInitialize` will be appended to `context` object hence available to `onRender` and `onFinalize`.
* To avoid problems with page load timing, move context creation to the `onCreateContext` method.
* By default, `onRender` method manages resizing of canvas, viewport and framebuffer.
* Makes it easy to wait for the HTML page to load before creating a canvas and WebGL resources.

References:

* [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html#drawingbuffer) contains excellent information on the subtleties of the how the WebGL context's drawing buffer and the HTML canvas interact.
* When running in the browser, this class uses [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)


## Usage

Autocreates a canvas/context
```js
import {AnimationLoop, ClipSpace} from '@luma.gl/core';

const animationLoop = new AnimationLoop({
  onInitialize({gl}) {
    // Keys in the object returned here will be available in onRender
    return {
      clipSpaceQuad: new ClipSpace({gl, fs: FRAGMENT_SHADER})
    };
  },
  onRender({tick, clipSpaceQuad}) {
    // Tick is autoupdated by AnimationLoop
    clipSpaceQuad.setUniforms({uTime: tick * 0.01}).draw();
  }
});

animationLoop.start();
```

Use a canvas in the existing DOM through its HTML id
```js
animationLoop.start({canvas: 'my-canvas'});
```

## Methods

### constructor(props : Object)

```js
new AnimationLoop({
  onCreateContext,
  onInitialize,
  onFinalize,
  onRender,

  autoResizeViewport,
  autoResizeDrawingBuffer
});
```

* `props.onCreateContext`=`null` (callback) - function without parameters that returns a `WebGLRenderingContext`. This callback will be called exactly once, after page load completes.
* `props.onInitialize` (callback) - if supplied, will be called once after first `start()` has been called, after page load completes and a context has been created.
* `props.onRender`=`null` (callback) - Called on every animation frame.
* `props.onFinalize`=`null` (callback) - Called once when animation is stopped. Can be used to delete objects or free any resources created during `onInitialize`.
* `props.autoResizeViewport`=`true` - If true, calls `gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)` each frame before `onRender` is called. Set to false to control viewport size.
* `props.autoResizeDrawingBuffer`=`true` - If true, checks the canvas size every frame and updates the drawing buffer size if needed.
* `props.useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.
* `props.gl`=`null` (WebGLContext) - If supplied, will render into this external context instead of creating a new one.
* `props.glOptions`=`{}` (object) - Options to create the WebGLContext with. See [createGLContext](/docs/api-reference/webgl/context/context.md).
* `props.debug`=`false` (bool) - Enable debug mode will provide more validations and error messages, but less performant.
* `props.createFramebuffer`=`false` (bool) - If true, will make a `framebuffer` (FrameBuffer) parameter available to `onInitialize` and `onRender` callbacks.


### start([options : Object]) : AnimationLoop

Restarts the animation

`animationLoop.start(options)`

* `options`=`{}` (object) - Options to create the WebGLContext with. See [createGLContext](/docs/api-reference/webgl/context/context.md).

### stop() : AnimationLoop

Stops the animation

`animationLoop.stop()`

### waitForRender() : Promise

Returns a promise which resolves in the next frame after rendering and the `onRender` callback have completed.

```js
const loop = await animationLoop.waitForRender()
// can now read pixels from webgl context
loop.gl.readPixels(...)
```

### redraw() : AnimationLoop

Immediately invokes a redraw (call `onRender` with updated animation props). Only use if the canvas must be updated synchronously.

### setNeedsRedraw(reason : String) : AnimationLoop

`animationLoop.setNeedsRedraw(reason)`

* `reason` (`String`) - A human readable string giving a hint as to why redraw was needed (e.g. "geometry changed").

If set, the value will be provided as the `needsRedraw` field to the `onRender` callback.

Notes:
* `onRender` will be called for each animation frame regardless of whether this flag is set, and the redraw reason is automatically cleared.
* If called multiple times, the `reason` provided in the first call will be remembered.
* `AnimationLoop` automatically sets this flag if the WebGL context's drawing buffer size changes.


### setProps(props : Object) : AnimationLoop

`animationLoop.setProps({...props})`

* `props.autoResizeViewport` - Call `gl.viewport` before each call to `onRender()`
* `props.autoResizeDrawingBuffer` - Update the drawing buffer size to match the canvas size before each call to `onRender()`
* `props.useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.

### attachTimeline(timeline: Timeline)

Attach an `Timeline` object to the animation loop. Allows time produced for animations to be paused, played, etc. See `Timeline` documentation for more info.


### detachTimeline()

Detach the currently attached timeline from the animation loop.


### toDataURL

Returns returns a `Promise` that resolves to the data URL of the canvas once drawing operations are complete for the current frame. The data URL can be used as the `src` for an HTML image element.

`animationLoop.toDataURL()`


## Callback Parameters

The callbacks `onInitialize`, `onRender` and `onFinalize` that the app supplies to the `AnimationLoop`, will be called with an object containing named parameters:

| Parameter | Type | Description |
| ---       | ---  | --- |
| `_animationLoop` | `AnimationLoop` | (**experimental**) The calling `AnimationLoop` instance |
| `gl`      | `WebGLRenderingContext` | This `AnimationLoop`'s gl context. |
| `canvas`  | `HTMLCanvasElement` or `OffscreenCanvas` | The canvas associated with this context. |
| `width`   | The drawing buffer width, in "device" pixels (can be different from canvas.width). |
| `height`  | The drawing buffer height, in "device" pixels (can be different from canvas.width). |
| `aspect`  | The canvas aspect ratio (width/height) to update projection matrices |
| `useDevicePixels` | Boolean indicating if canvas is utilizes full resolution of Retina/
| `needsRedraw` | `String` | Redraw flag (will be automatically set if drawingBuffer resizes) |
| `time`    | `Number` | Milliseconds since `AnimationLoop` was created (monotonic). |
| `tick`    | `Number` | Counter that updates for every frame rendered (monotonic). |
| `framebuffer` | `FrameBuffer` | Availabel if `createFrameBuffer: true` was passed to the constructor. |
| `_mousePosition` | `[x, y]` or `null` | (**experimental**) Current mouse position over the canvas. |
| `_offScreen` | `Boolean` | (**experimental**) If the animation loop is rendering to an OffscreenCanvas. |
| `_timeline` | `Trimeline` | (**experimental**) `Timeline` object tracking the animation timeline and channels. |
| ...       | Any fields in the object that was returned by the `onInitialize` method. |

### Frame timers
* The animation loop tracks GPU and CPU render time of each frame the in member properties `cpuTime` and `gpuTime`. If `gpuTime` is set to `-1`, then the timing for the last frame was invalid and should not be used (this rare and might occur, for example, if the GPU was throttled mid-frame).


## Remarks

* You can instantiate multiple `AnimationLoop` classes in parallel, rendering into the same or different `WebGLRenderingContext`s.
* Works both in browser and under Node.js.
* All `AnimationLoop` methods can be chained.
* Postpones context creation until the page (i.e. all HTML) has been loaded. At this time it is safe to specify canvas ids when calling [`createGLContext`](/docs/api-reference/webgl/context/context.md).
* The supplied callback function must return a WebGLRenderingContext or an error will be thrown.
* This callback registration function should not be called if a `WebGLRenderingContext` was supplied to the AnimationLoop constructor.
