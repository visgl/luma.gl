import {AnimationLoop, withParameters} from '@luma.gl/core';

// This code could be folded into the core animation loop
export default class DisplayAnimationLoop extends AnimationLoop {
  setDisplay(display) {
    if (this.display !== display) {
      if (this.display) {
        this.display.detachDisplay();
      }

      this.display = display;

      if (this.display && this.gl) {
        this.display.attachDisplay(this.gl);
      }
    }
  }

  onFrame(...args) {
    const views = this.display && this.display.getViews();
    if (!views) {
      return super.onFrame(...args);
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
        () => super.onRender({...options, ...view})
      );
    }

    this.display.submitFrame();
    this.gl.viewport(0, 0, width, height);
    return null;
  }

  _createWebGLContext(...args) {
    const before = this.gl;
    super._createWebGLContext(...args);

    if (before !== this.gl && this.display) {
      this.display.attachDisplay(this.gl);
    }
  }

  _requestAnimationFrame(renderFrame) {
    if (this.display && this.display.requestAnimationFrame(renderFrame)) {
      return;
    }

    super._requestAnimationFrame(renderFrame);
  }
}
