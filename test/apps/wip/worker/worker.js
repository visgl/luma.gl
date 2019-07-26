import {_AnimationLoopProxy as AnimationLoopProxy} from '@luma.gl/core';

// import AnimationLoop from 'examples/core/cubemap/app';
// import AnimationLoop from 'examples/core/fragment/app';
// import AnimationLoop from 'examples/core/instancing/app';
// import AnimationLoop from 'examples/core/mandelbrot/app';
// import AnimationLoop from 'examples/core/picking/app';
import AnimationLoop from 'examples/core/shadowmap/app';
// import AnimationLoop from 'examples/core/transform/app';
// import AnimationLoop from 'examples/core/transform-feedback/app';

export default AnimationLoopProxy.createWorker(new AnimationLoop())(self);
