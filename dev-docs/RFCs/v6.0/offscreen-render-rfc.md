# RFC: Offscreen Rendering

* **Authors**: Xiaoji
* **Date**: March 2018
* **Status**: Pending Review

Notes:
- Initial implementation of OffscreenAnimationLoop [#453](https://github.com/uber/luma.gl/pull/453)
- Example usage of OffscreenAnimationLoop [#454](https://github.com/uber/luma.gl/pull/454)


## Motivation

WebGL rendering performance can greatly affect UI responsiveness. The experimental [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) API in Chrome and Firefox allows us to move WebGL rendering to a worker thread, and free up the main thread to handle DOM interactions. It is highly desirable for heavy front-end applications.


## State of the API

OffscreenCanvas is in active development (behind experimental flags) in both FF and [Chrome](https://www.chromestatus.com/feature/5424182347169792). In Chrome, go to `chrome://flags` and enable "Experimental web platform features."

The API still seems limited/unstable:
- FF only support OffscreenCanvas with WebGL1 context.
- Chrome's render buffer does not update in some test scenarios.


## Proposal: OffscreenAnimationLoop

Add an `OffscreenAnimationLoop` that mirrors the `AnimationLoop` class but delegate rendering to a worker.

Static methods:
- `createWorker(opts)` - returns script that can be used to spin up a new Worker. `opts` are the options used to construct an `AnimationLoop` instance on the worker thread.

Constructor:
- `new OffscreenAnimationLoop(opts)` - `opts` are the same options used to construct an `AnimationLoop`, with additional fields:
    + `opts.worker` (Worker) - the worker instance running a script created by `OffscreenAnimationLoop.createWorker`

Methods:
- `setProps(props)` - equivalent to `animationLoop.setProps(props)`
- `start(opts)` - equivalent to `animationLoop.start(opts)`
- `stop()` - equivalent to `animationLoop.stop()`


### Examples

```
/// animation.js
import {GL, Model, Framebuffer, Matrix4} from 'luma.gl';

export default {
    onInitialize: () => {
        // set up scene
    },
    onRender: () => {
        // render frame
    },
    glOptions: {},
    autoResizeDrawingBuffer: true
};
```

Render on main thread:
```
/// app.js
import animationLoopOptions from './animation';
import {AnimationLoop} from 'luma.gl';

const animationLoop = new AnimationLoop(animationLoopOptions);
animationLoop.start({canvas: 'lumagl-canvas'});
```

Render on worker thread:
```
/// app.js
import animationLoopOptions from './animation';
import {OffscreenAnimationLoop} from 'luma.gl';
import webworkify from 'webworkify';

const worker = OffscreenAnimationLoop.createWorker(animationLoopOptions);
const animationLoop = new OffscreenAnimationLoop({
    ...animationLoopOptions,
    worker: webworkify(worker)
});
animationLoop.start({canvas: 'lumagl-canvas'});
```



## Challenges

The main challenge in this effort is that DOM properties are accessed in various places of the code base (e.g. webgl-utils, AnimationLoop, hover/click handling, viewport controls). Certain globals such as `window` `document` and `HTMLCanvasElement` are not available to the worker thread. We should either improve the compatibility of existing code, or invest in separating DOM-dependent code from the core.

