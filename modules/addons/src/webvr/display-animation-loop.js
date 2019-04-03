import {AnimationLoop, withParameters} from '@luma.gl/core';

// This code could be folded into the core animation loop
export default class DisplayAnimationLoop extends AnimationLoop {
  setDisplay(display) {
    this.display = display;
  }

  onFrame(options) {
    const views = (this.display && this.display.getViews()) || [];

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
        () => super.onRender({...options, ...view})
      );
    }

    this.display.submitFrame();
    this.gl.viewport(0, 0, width, height);
  }

  _requestAnimationFrame(renderFrame) {
    if (this.display) {
      if (this.display.requestAnimationFrame()) {
        return;
      }
    }
    super._requestAnimationFrame(renderFrame);
  }
}
