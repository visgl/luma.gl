// luma.gl, MIT
// @ts-nocheck

import {withParameters} from '@luma.gl/webgl';
import {ClassicAnimationLoop as AnimationLoop} from '@luma.gl/webgl-legacy';

export class Display {
  readonly animationLoop: AnimationLoop;

  constructor(props?) {
    // TODO
    this.animationLoop = null;
  }

  destroy(): void {}
  /** @deprecated use .delete() */
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
