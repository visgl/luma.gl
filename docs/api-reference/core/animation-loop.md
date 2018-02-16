# AnimationLoop

While this class is named to suggest that it is a wrapper for [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame), it provides a number of features related to initialization and animation of a `WebGLRenderingContext` or `WebGL2RenderingContext`.

* Makes it easy to wait for the HTML page to load before creating resources.
* Provides a number of commonly needed variables as part of the `context` object which is passed to `onRender` and `onFinalize` callbacks.
* Objects returned by `onInitailize` will be appended to `context` object hence available to `onRender` and `onFinalize`.
* To avoid problems with page load timing, move context creation to the `onCreateContext` method.
* By default, `onRender` method manages resizing of canvas, viewport and framebuffer.


## Usage

Short example:
```js
new AnimationLoop({
  onCreateContext() {
    return createGLContext({canvas: 'canvas-0'}))
  },
  onInitialize({gl}) {
    return {
      clipSpaceQuad: new ClipSpaceQuad({gl, fs: CONTEXT_0_FRAGMENT_SHADER})
    };
  },
  onRender(context) {
    const {tick, clipSpaceQuad} = context;
    clipSpaceQuad.render({uTime: tick * 0.01});
  }
});
```

## Callback Parameters

The callbacks that the app supplies to the `AnimationLoop` will be called with an object containing named parameters. The parameter object will contain the following values:

* `gl` - This `AnimationLoop`'s `WebGLRenderingContext`.
* `canvas` - The canvas associated with the rendering context.
* `width`: The canvas width, in device pixels.
* `height`: The canvas height, in device pixels.
* `aspect`: The canvas aspect ratio (width/height) to update projection matrices
* `useDevicePixels`: A boolean value, indicates whether canvas is created to utilize full resolution of Retina/HD displays.
* `time`: A monotonic value in milliseconds since `AnimationLoop` was created.
* `tick`: A monotonic counter that updates for every frame rendered.
* And objects that are returned by `onInitialize` method.


## Methods

### constructor

Parameters:
* `onInitialize` (callback) - function that will be called exactly once after `start()` has been called, after page load completes and a context has been created. The callback will be called with an initial object containing a gl context object. Can return a promise (e.g. for texture or model loads)
* `onCreateContext` (callback) - function without parameters that returns a `WebGLRenderingContext`. This callback will be called exactly once, after page load completes.
* `onRenderFrame` (callback) - Calling `frame` will automatically start the animation. If this is not desired, follow immediately with a `stop()`.
* `onFinalize` (callback) - Called once when animation is stopped. Can be used to delete objects or free any resources created during `onInitialize`.


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
| `needsRedraw` | `String | null` | Redraw flag (will be automatically set if drawingBuffer resizes) |
| `useDevicePixels` | `Boolean` | Does canvas utilize full resolution of Retina/HD displays. |
| `time`    | `Number` | Milliseconds since `AnimationLoop` was created (monotonic). |
| `tick`    | `Number` | Counter that updates for every frame rendered (monotonic). |
| ...       | Any fields in the object that was returned by `onInitialize` method. |


## Remarks

* You can instantiate multiple `AnimationLoop` classes in parallel, rendering into the same or different `WebGLRenderingContext`s.
* Works both in browser and under Node.js.
* All `AnimationLoop` methods can be chained.
* Postpones context creation until the page (i.e. all HTML) has been loaded. At this time it is safe to specify canvas ids when calling [`createGLContext`](/#/documentation/api-reference/create-context).
* The supplied callback function must return a WebGLRenderingContext or an error will be thrown.
* This callback registration function should not be called if a `WebGLRenderingContext` was supplied to the AnimationLoop constructor.
