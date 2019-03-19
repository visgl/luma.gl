import {_AnimationLoopProxy as AnimationLoopProxy} from '@luma.gl/core';

import animationLoop from '../../core/cubemap/app';
// import animationLoop from '../../core/fragment/app';
// import animationLoop from '../../core/instancing/app';
// import animationLoop from '../../core/mandelbrot/app';
// import animationLoop from '../../core/picking/app';
// import animationLoop from '../../core/shadowmap/app';
// import animationLoop from '../../core/transform/app';
// import animationLoop from '../../core/transform-feedback/app';

export default AnimationLoopProxy.createWorker(animationLoop);
