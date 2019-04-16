import {animationLoop, AppAnimationLoop} from './concentrics-demo';
// import randomNoiseAnimationLoop from './random-noise-demo';

// Pick one to fit with demo framework (until it can handle multiple exports)
export default AppAnimationLoop;

/* global window */
if (typeof window !== 'undefined') {
  window.startApp = function startApp() {
    animationLoop.start();
    // randomNoiseAnimationLoop.start();
  };
}
