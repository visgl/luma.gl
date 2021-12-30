# RFC: Off-Thread (aka Offscreen) Rendering

* **Authors**: Xiaoji
* **Date**: March 2018
* **Status**: Pending Review

Notes:

* Initial implementation of OffscreenAnimationLoop [#453](https://github.com/visgl/luma.gl/pull/453)
* Example usage of OffscreenAnimationLoop [#454](https://github.com/visgl/luma.gl/pull/454)


## Motivation

WebGL rendering performance can greatly affect UI responsiveness. The experimental [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) API in Chrome and Firefox allows us to move WebGL rendering to a worker thread, and free up the main thread to handle DOM interactions. It is highly desirable for heavy front-end applications.


## State of the API

OffscreenCanvas is in active development (behind experimental flags) in both FF and [Chrome](https://www.chromestatus.com/feature/5424182347169792). In Chrome, go to `chrome://flags` and enable "Experimental web platform features."

The API still seems limited/unstable:

* FF:
  + [57.0] Only supports OffscreenCanvas with WebGL1 context; `gl.commit` throws error after first render
  + [59.0] Crashes on `gl.commit`
* Chrome
  + [64.0] Instanced rendering does not update render buffer
  + [65.0] Instanced rendering works, slows down after running a while. Stops updating when set pickingPosition to `null`.


## Proposal: OffscreenAnimationLoop

> Class name TBD. Other suggestions: `AnimationLoopProxy`, `OffThreadAnimationLoop` , `WorkerThreadAnimationLoop`, `ThreadedAnimationLoop`, `WorkerAnimationLoop`

Add an `OffscreenAnimationLoop` that mirrors the `AnimationLoop` class but delegate rendering to a worker.

Static methods:

* `createWorker(opts)` - returns script that can be used to spin up a new Worker. `opts` are the options used to construct an `AnimationLoop` instance on the worker thread.

Constructor:

* `new OffscreenAnimationLoop(opts)` - `opts` are the same options used to construct an `AnimationLoop`, with additional fields:
  + `opts.worker` (Worker) - the worker instance running a script created by `OffscreenAnimationLoop.createWorker`

Methods:

* `setProps(props)` - equivalent to `animationLoop.setProps(props)`
* `start(opts)` - equivalent to `animationLoop.start(opts)`
* `stop()` - equivalent to `animationLoop.stop()`


### Examples

Render on main thread:

```typescript
// app.js
import animationLoopOptions from './animation';
import {AnimationLoop} from 'luma.gl';

const animationLoop = new AnimationLoop({
    // animationLoopOptions
});
animationLoop.start({canvas: 'lumagl-canvas'});
```

Render on worker thread:

```typescript
// app.js
import animationLoopOptions from './animation';
import {OffscreenAnimationLoop} from 'luma.gl';
import webworkify from 'webworkify';

const worker = OffscreenAnimationLoop.createWorker({
    // animationLoopOptions
});
const animationLoop = new OffscreenAnimationLoop({
    worker: webworkify(worker)
});
animationLoop.start({canvas: 'lumagl-canvas'});
```


## Proposal: Interactivity

`AnimationLoop` does not directly handle user input (mousemove, click, etc.). This is usually not an issue as the user can update their own application state from event callbacks and then access that state from within `onRender`. In the offscreen rendering case, this is no longer possible as `onRender` is on a different thread from where the event callbacks are executed.

The proposed solution is to expose a new API on both `AnimationLoop` and `OffscreenAnimationLoop` for applications to send custom data to the renderer:

* Add `setUserData` method to `AnimationLoop`. It adds a field `userData` to `animationLoop._callbackData` which can be accessed in the `onRender` callback.
* Add `setUserData` method to `OffscreenAnimationLoop`. It posts the user data to the worker which then calls `animationLoop.setUserData`.


## Challenges

The main challenge in this effort is that DOM properties are accessed in various places of the code base (e.g. webgl-utils, AnimationLoop, hover/click handling, viewport controls). Certain globals such as `window` `document` and `HTMLCanvasElement` are not available to the worker thread. We should either improve the compatibility of existing code, or invest in separating DOM-dependent code from the core.

