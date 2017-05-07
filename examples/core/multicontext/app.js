import concentricsAnimationLoop from './concentrics-demo';
import randomNoiseAnimationLoop from './random-noise-demo';

// Pick one to fit with demo framework (until it can handle multiple exports)
export default randomNoiseAnimationLoop;

/* global window */
if (typeof window !== 'undefined') {
  window.startApp = function startApp() {
    concentricsAnimationLoop.start();
    randomNoiseAnimationLoop.start();
  };
}
