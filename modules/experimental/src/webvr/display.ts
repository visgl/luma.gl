import {AnimationLoop} from '@luma.gl/engine';
import {withParameters} from '@luma.gl/gltools';

export default class Display {
  readonly animationLoop: AnimationLoop;

  constructor(props?) {
    // TODO
    this.animationLoop = null;
  }

  delete(): void {}

  getViews(options): {
    params: {
      viewport: any[];
      scissor: any[];
      scissorTest: boolean;
    };
  }[] {
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

  submitFrame(): boolean {
    return true;
  }

  // return true if animation frame has been requested
  requestAnimationFrame(renderFrame): boolean {
    return false;
  }

  // AnimationLoop calls this API
  _renderFrame(options): boolean {
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
