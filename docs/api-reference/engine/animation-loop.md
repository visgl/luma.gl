# AnimationLoop

Manages an animation loop and optionally a WebGL context and a WebGL canvas. It provides a number of features related to initialization and animation of a WebGL context.

## Usage


```typescript
import {AnimationLoop, ClipSpace} from '@luma.gl/engine';

const animationLoop = new AnimationLoop({
  device: luma.createDevice(...),
  override onInitialize({device}) {
    // Keys in the object returned here will be available in onRender
    this.clipSpaceQuad = new ClipSpace({device, fs: FRAGMENT_SHADER});
  }
  override onRender({tick}) {
    // Tick is autoupdated by AnimationLoop
    clipSpaceQuad.setUniforms({uTime: tick * 0.01}).draw();
  }
});

animationLoop.start();
```

Use a canvas in the existing DOM through its HTML id

```typescript
animationLoop.start({canvas: 'my-canvas'});
```

## Types


### AnimationLoopProps

| Property                   | Type                        | Default | Description                                                                                                          |
| -------------------------- | --------------------------- |
| `device?`                  | `Device \| Promise<Device>` |         | the `Device` to render into.                                                                                         |
| `onInitialize?`            | (callback)                  |         | Called once after the first call to `animationLoop.start()`. Use to create GPU resources                             |
| `onRender?`                | (callback)                  |         | - Called on every animation frame. Use to render .                                                                   |
| `onFinalize?`              | (callback)                  |         | - Called once when animation is stopped. Used to delete objects or free any resources created during `onInitialize?` |
| `onError`                  | (callback)                  |         | - Called when an error is about to be thrown.                                                                        |
| `autoResizeViewport?`      | `boolean`                   | `true`  | If true, auto resizes GPU viewport each frame before `onRender` is called.                                           |
| `autoResizeDrawingBuffer?` | `boolean`                   | `true`  | If true, resizes the drawing buffer  each frame before `onRender` is called.                                         |
| `useDevicePixels?`         | `boolean \| number`         |         | Multiplier. `true` uses `window.devicePixelRatio` as a multiplier in `autoResizeDrawingBuffer` etc.                  |
| `stats?`                   | `Stats`                     |         | A probe.gl `Stats` instance, Auto-created if not supplied.                                                           |

### AnimationProps

The `onInitialize`, `onRender` and `onFinalize`callbacks will be called with an object containing the following fields:

| Parameter         | Type                                     | Description                                                                         |
| ----------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `animationLoop`   | `AnimationLoopTemplate`                  | The calling `AnimationLoopTemplate` instance                                        |
| `device`          | `Device`                                 | This `AnimationLoopTemplate`'s gl context.                                          |
| `canvas`          | `HTMLCanvasElement` or `OffscreenCanvas` | The canvas associated with this context.                                            |
| `aspect`          | `number`                                 | The canvas aspect ratio (width/height) to update projection matrices                |
| `width`           |                                          | The drawing buffer width, in "device" pixels (can be different from canvas.width).  |
| `height`          |                                          | The drawing buffer height, in "device" pixels (can be different from canvas.width). |
| `useDevicePixels` | `boolean`                                | Boolean indicating if canvas is utilizes full resolution of Retina/                 |
| `needsRedraw`     | `String`                                 | Redraw flag (will be automatically set if drawingBuffer resizes)                    |
| `time`            | `Number`                                 | Milliseconds since `AnimationLoopTemplate` was created (monotonic).                 |
| `tick`            | `Number`                                 | Counter that updates for every frame rendered (monotonic).                          |
| `renderPass`      | `RenderPass`                             | Availabel if `createFrameBuffer: true` was passed to the constructor.               |
| `_mousePosition`  | `[x, y]` or `null`                       | (**experimental**) Current mouse position over the canvas.                          |
| `_timeline`       | `Timeline`                               | (**experimental**) `Timeline` object tracking the animation timeline and channels.  |


## Methods

### constructor

Creates a new `AnimationLoop`.

```ts
new AnimationLoop(props : AnimationLoopProps)
```

- `props` - See documentation of `AnimationLoopProps` above.

### setProps(props : Object)

`animationLoop.setProps({...props})`

- `props.autoResizeViewport` - Call `gl.viewport` before each call to `onRender()`
- `props.autoResizeDrawingBuffer` - Update the drawing buffer size to match the canvas size before each call to `onRender()`
- `props.useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.

### start()

Restarts the animation

```ts
animationLoop.start(options)
```

- `options`=`{}` (object) - Options to create the WebGLContext with. 

### stop()

Stops the animation

```ts
animationLoop.stop()
```

### waitForRender() : Promise

Returns a promise which resolves in the next frame after rendering and the `onRender` callback have completed.

```typescript
const loop = await animationLoop.waitForRender()
// can now e.g. read pixels from webgl context
...
```

### redraw()

Immediately invokes a redraw (call `onRender` with updated animation props). Only use if the canvas must be updated synchronously.

### setNeedsRedraw()

`animationLoop.setNeedsRedraw(reason: string)`

- `reason` (`String`) - A human readable string giving a hint as to why redraw was needed (e.g. "geometry changed").

If set, the value will be provided as the `needsRedraw` field to the `onRender` callback.

Notes:

- `onRender` will be called for each animation frame regardless of whether this flag is set, and the redraw reason is automatically cleared.
- If called multiple times, the `reason` provided in the first call will be remembered.
- `AnimationLoop` automatically sets this flag if the WebGL context's drawing buffer size changes.


### attachTimeline()

```ts
attachTimeline(timeline: Timeline)
```

Attach an `Timeline` object to the animation loop. Allows time produced for animations to be paused, played, etc. See `Timeline` documentation for more info.

### detachTimeline()

Detach the currently attached timeline from the animation loop.

### toDataURL()

Returns returns a `Promise` that resolves to the data URL of the canvas once drawing operations are complete for the current frame. The data URL can be used as the `src` for an HTML image element.

`animationLoop.toDataURL()`

## Callback Parameters

The callbacks `onInitialize`, `onRender` and `onFinalize` that the app supplies to the `AnimationLoop`, will be called with an object containing named parameters:

### Frame timers

- The animation loop tracks GPU and CPU render time of each frame the in member properties `cpuTime` and `gpuTime`. If `gpuTime` is set to `-1`, then the timing for the last frame was invalid and should not be used (this rare and might occur, for example, if the GPU was throttled mid-frame).


## Remarks

- You can instantiate multiple `AnimationLoop` classes in parallel, rendering into the same or different `devices`.
- Works both in browser and under Node.js.
- All `AnimationLoop` methods can be chained.
- Postpones context creation until the page (i.e. all HTML) has been loaded. At this time it is safe to specify canvas ids.
- The supplied callback function must return a WebGLRenderingContext or an error will be thrown.
- This callback registration function should not be called if a `WebGLRenderingContext` was supplied to the AnimationLoop constructor.
- `useDevicePixels` can accept a custom ratio (Number), instead of `true` or `false`. This allows rendering to a much smaller or higher resolutions. When using high value (usually more than device pixel ratio), it is possible it can get clamped down, this happens due to system memory limitation, in such cases a warning will be logged to the browser console.
- `onInitialize`` is called after page load completes and the passed in device promise has been resolved (the device has been created).                               
