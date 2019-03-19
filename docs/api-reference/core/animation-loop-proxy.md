# AnimationLoopProxy (Experimental)

> This class is experimental. Its API may change between minor releases.

Manages an [AnimationLoop](/docs/api-reference/core/animation-loop.md) that runs on a worker thread.

## Usage

Create a worker:
```js
// animation-worker.js
import {
  AnimationLoop, _AnimationLoopProxy as AnimationLoopProxy
} from '@luma.gl/core';

const animationLoop = new AnimationLoop({...});
AnimationLoopProxy.createWorker(animationLoop)(self);
```

Use a bundler e.g. Webpack to transpile and bundle `animation-worker.js` into a file e.g. `animation-worker.es5.js`. You can then use it as this:

```js
import {_AnimationLoopProxy as AnimationLoopProxy} from '@luma.gl/core';

new AnimationLoopProxy(new Worker('animation-worker.es5.js')).start();
```

## Static Methods

### createWorker

```js
AnimationLoopProxy.createWorker(animationLoop);
```

Returns a function `self => {...}` that sets up the message handling inside the worker thread when called with a [WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) instance.

## Methods

### constructor(worker: Worker, props : Object)

```js
new AnimationLoopProxy(worker, {
  onInitialize,
  onFinalize,
  useDevicePixels,
  autoResizeDrawingBuffer
});
```

* `worker` - a [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) instance using code created from `AnimationLoopProxy.createWorker`.

* `props.onInitialize` (callback) - if supplied, will be called once after first `start()` has been called, after page load completes and a context has been created.
* `props.onFinalize`=`null` (callback) - Called once when animation is stopped. Can be used to delete objects or free any resources created during `onInitialize`.
* `props.autoResizeDrawingBuffer`=`true` - If true, checks the canvas size every frame and updates the drawing buffer size if needed.
* `props.useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.

### start([options : Object]) : AnimationLoopProxy

Initializes and then (re)starts the animation

```js
animationLoopProxy.start(options)
```

* `options.canvas` (string | HTMLCanvasElement) - A *string* containing the `id` of an existing HTML element or a *DOMElement* instance. If `null` or not provided, a new canvas will be created.

### stop() : AnimationLoopProxy

Stops the animation

```js
animationLoopProxy.stop();
```

### waitForRender() : Promise

Returns a promise which resolves in the next frame after rendering has completed.

```js
const loop = await animationLoop.waitForRender()
// can now read pixels from webgl context
loop.gl.readPixels(...)
```

### setProps(props: Object) : AnimationLoopProxy

```js
animationLoopProxy.setProps({...props});
```

* `props.autoResizeDrawingBuffer` - Update the drawing buffer size to match the canvas size before each call to `onRenderFrame()`
* `props.useDevicePixels` - Whether to use `window.devicePixelRatio` as a multiplier, e.g. in `autoResizeDrawingBuffer` etc.
