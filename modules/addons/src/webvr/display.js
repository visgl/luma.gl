import {withParameters} from '@luma.gl/core';

export default class Display {
  attachDisplay(gl) {
    this.gl = gl;
  }

  detachDisplay() {
    this.gl = null;
  }

  getViews(options) {
    const [width, height] = options;
    return [
      {
        params: {
          viewport: [0, 0, width, height],
          scissor: [0, 0, width, height]
        },
        viewName: 'single view',
        vrProjectionMatrix: null,
        vrViewMatrix: null
      }
    ];
  }

  submitFrame() {
    return true;
  }

  // return true if animation frame has been requested
  requestAnimationFrame() {
    return false;
  }

  // AnimationLoop calls this API

  _renderFrame(...args) {
    const views = this.getViews();
    if (!views) {
      return false;
    }

    const options = args[0];
    const {width, height} = options;

    // Need both vrPresenting and vrFrame
    // to avoid race conditions when we exit VR
    // after we schedule an animation frame
    for (const view of views) {
      const [x, y, w, h] = view.viewport;
      const viewRect = [x * width, y * height, w * width, h * height];

      withParameters(
        this.gl,
        {
          viewport: viewRect,
          scissor: viewRect,
          scissorTest: true
        },
        () => this.animationLoop.onRender({...options, ...view})
      );
    }

    this.submitFrame();
    this.gl.viewport(0, 0, width, height);
    return true;
  }
}
