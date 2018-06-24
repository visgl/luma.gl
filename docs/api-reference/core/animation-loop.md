# AnimationLoop

Manages an animation loop and optionally a WebGL context and a WebGL canvas. It provides a number of features related to initialization and animation of a WebGL context.

* Provides a number of commonly needed variables as part of the `context` object which is passed to `onRender` and `onFinalize` callbacks.
* Objects returned by `onInitailize` will be appended to `context` object hence available to `onRender` and `onFinalize`.
* To avoid problems with page load timing, move context creation to the `onCreateContext` method.
* By default, `onRender` method manages resizing of canvas, viewport and framebuffer.
* Makes it easy to wait for the HTML page to load before creating a canvas and WebGL resources.

References:

* [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html#drawingbuffer) contains excellent information on the subtleties of the how the WebGL context's drawing buffer and the HTML canvas interact.
* When running in the browser, this class uses [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)


## Usage

Autocreates a canvas/context
```js
import {AnimationLoop} from 'luma.gl';

new AnimationLoop({
  onInitialize({gl}) {
    // Keys in the object returned here will be available in onRenderFrame
    return {
      clipSpaceQuad: new ClipSpaceQuad({gl, fs: FRAGMENT_SHADER})
    };
  },
  onRender({tick, clipSpaceQuad}) {
    // Tick is autoupdated by AnimationLoop
    clipSpaceQuad.render({uTime: tick * 0.01});
  }
});
```

Use a canvas in the existing DOM through its HTML id
```js
import {AnimationLoop, createGLContext} from 'luma.gl';

new AnimationLoop({
  onCreateContext() {
    return createGLContext({canvas: 'canvas-0'}))
  },
  ...
  onInitialize({gl}) { ... }
  onRender({...}) { ... }
});
```

## Methods

### constructor

```js
new AnimationLoop({
  onCreateContext,
  onInitialize,
  onFinalize,
  onRenderFrame,

  autoResizeViewport,
  autoResizeDrawingBuffer
});
```

* `onCreateContext`=`null` (callback) - function without parameters that returns a `WebGLRenderingContext`. This callback will be called exactly once, after page load completes.
* `onInitialize` (callback) - if supplied, will be called once after first `start()` has been called, after page load completes and a context has been created.
* `onFinalize`=`null` (callback) - Called once when animation is stopped. Can be used to delete objects or free any resources created during `onInitialize`.
* `onRenderFrame`=`null` (callback) - Calling `frame` will automatically start the animation. If this is not desired, follow immediately with a `stop()`.
* `autoResizeViewport`=`true` - If true, calls `gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)` each frame before `onRenderFrame` is called. Set to false to control viewport size.
* `autoResizeDrawingBuffer`=`true` - If true, checks the canvas size every frame and updates the drawing buffer size if needed.


### start

Restarts the animation

`animationLoop.start()`


### stop

Stops the animation

`animationLoop.stop()`


### setNeedsRedraw

`animationLoop.setNeedsRedraw(reason)`

* `reason` (`String`) - A human readable string giving a hint as to why redraw was needed (e.g. "geometry changed").

If set, the value will be provided as the `needsRedraw` field to the `onRenderFrame` callback.

Notes:
* `onRenderFrame` will be called for each animation frame regardless of whether this flag is set, and the redraw reason is automatically cleared.
* If called multiple times, the `reason` provided in the first call will be remembered.
* `AnimationLoop` automatically sets this flag if the WebGL context's drawing buffer size changes.


### setProps

`animationLoop.setProps({...props})`

* `autoResizeViewport` - Call `gl.viewport` before each call to `onRenderFrame()`
* `autoResizeDrawingBuffer` - Update the drawing buffer size to match the canvas size before each call to `onRenderFrame()`
* `useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.


## Callbacks

The callbacks that the app supplies to the `AnimationLoop`, will be called with an object containing named parameters.


### onInitialize

The callback will be called with an initial object containing a gl context object. Can return a promise (e.g. for texture or model loads)

For the `onInitialize` callback, the parameter object will contain the following fields:

| Parameter | Type | Description |
| ---       | ---  | --- |
| `gl`      | `WebGLRenderingContext` | This `AnimationLoop`'s gl context. Note that if the context is associated with a canvas, it is accessible through `gl.canvas` |
| `width`   | The drawing buffer width, in "device" pixels (can be different from canvas.width). |

| `height`  | The drawing buffer height, in "device" pixels (can be different from canvas.width). |
| `aspect`  | The canvas aspect ratio (width/height) to update projection matrices |
| `useDevicePixels` | Boolean indicating if canvas is utilizes full resolution of Retina/


### onRenderFrame

For the `onRenderFrame` callback, the parameter object will contain the following fields:

| Parameter | Type | Description |
| ---       | ---  | --- |
| `animationLoop` | `AnimationLoop` | The calling `AnimationLoop` |
| `gl`      | `WebGLRenderingContext` | This `AnimationLoop`'s gl context. Note that if the context is associated with a canvas, it is accessible through `gl.canvas` |
| `width`   | `Number` | The drawing buffer width, in "device" pixels (can be different from canvas.width). |
| `height`  | `Number` | The drawing buffer height, in "device" pixels (can be different from canvas.width). |
| `aspect`  | `Number` | The canvas aspect ratio (width/height) to update projection matrices |
| `needsRedraw` | `String` | Redraw flag (will be automatically set if drawingBuffer resizes) |
| `useDevicePixels` | `Boolean` | Does canvas utilize full resolution of Retina/HD displays. |
| `time`    | `Number` | Milliseconds since `AnimationLoop` was created (monotonic). |
| `tick`    | `Number` | Counter that updates for every frame rendered (monotonic). |
| ...       | Any fields in the object that was returned by `onInitialize` method. |


## Remarks

* You can instantiate multiple `AnimationLoop` classes in parallel, rendering into the same or different `WebGLRenderingContext`s.
* Works both in browser and under Node.js.
* All `AnimationLoop` methods can be chained.
* Postpones context creation until the page (i.e. all HTML) has been loaded. At this time it is safe to specify canvas ids when calling [`createGLContext`](/docs/api-reference/webgl/context/context.md).
* The supplied callback function must return a WebGLRenderingContext or an error will be thrown.
* This callback registration function should not be called if a `WebGLRenderingContext` was supplied to the AnimationLoop constructor.
