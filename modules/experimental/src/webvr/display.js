import {withParameters} from '@luma.gl/gltools';

export default class Display {
  getViews(options) {
    const {width, height} = options;
    return [
      {
        params: {
          viewport: [0, 0, width, height],
          scissor: [0, 0, width, height],
          scissorTest: true
        }
      }
    ];
  }

  submitFrame() {
    return true;
  }

  // return true if animation frame has been requested
  requestAnimationFrame(renderFrame) {
    return false;
  }

  delete() {}

  // AnimationLoop calls this API
  _renderFrame(options) {
    const views = this.getViews(options);
    if (!views) {
      return false;
    }

    const {gl} = this.animationLoop;
    for (const view of views) {
      withParameters(gl, view.params, () => this.animationLoop.onRender({...options, ...view}));
    }

    this.submitFrame();
    return true;
  }
}
