import {_AnimationLoopProxy as AnimationLoopProxy} from 'luma.gl';
import createWorker from 'webworkify-webpack';

// Required by webworkify-webpack :(
const worker = createWorker(require.resolve('./worker'));

const animationLoop = new AnimationLoopProxy(worker);

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
