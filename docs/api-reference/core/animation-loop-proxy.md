# AnimationLoopProxy (Expermental)

> This class is experimental. Its API may change between minor releases.

Manages an [AnimationLoop](/docs/api-reference/core/animation-loop.md) that runs on a worker thread.

## Usage

Create a worker:
```js
// animation-worker.js
import {AnimationLoop, _AnimationLoopProxy as AnimationLoopProxy} from 'luma.gl';

const animationLoop = new AnimationLoop({...});
AnimationLoopProxy.createWorker(animationLoop)(self);
```

Use a bundler e.g. Webpack to transpile and bundle `animation-worker.js` into a file e.g. `animation-worker.es5.js`. You can then use it as this:

```js
import {_AnimationLoopProxy as AnimationLoopProxy} from 'luma.gl';

new AnimationLoopProxy(new Worker('animation-worker.es5.js')).start();
```

## Static Methods

### createWorker

```js
AnimationLoopProxy.createWorker(animationLoop);
```

Returns a function `self => {...}` that sets up the message handling inside the worker thread when called with a [WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) instance.

## Methods

### constructor

```js
new AnimationLoopProxy(worker, {
  onInitialize,
  onFinalize,
  useDevicePixels,
  autoResizeDrawingBuffer
});
```

* `worker` - a [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) instance using code created from `AnimationLoopProxy.createWorker`.
* `options`
  - `onInitialize` (callback) - if supplied, will be called once after first `start()` has been called, after page load completes and a context has been created.
  - `onFinalize`=`null` (callback) - Called once when animation is stopped. Can be used to delete objects or free any resources created during `onInitialize`.
  - `autoResizeDrawingBuffer`=`true` - If true, checks the canvas size every frame and updates the drawing buffer size if needed.
  - `useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.

### start

Restarts the animation

```js
animationLoopProxy.start(options)
```

* `options`=`{}` (object) - Options to create the canvas with.
  + `options.canvas` (string | HTMLCanvasElement) - A *string* containing the `id` of an existing HTML element or a *DOMElement* instance. If `null` or not provided, a new canvas will be created.

### stop

Stops the animation

```js
animationLoopProxy.stop();
```

### setProps

```js
animationLoopProxy.setProps({...props});
```

* `autoResizeDrawingBuffer` - Update the drawing buffer size to match the canvas size before each call to `onRenderFrame()`
* `useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.

