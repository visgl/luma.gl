import {AnimationLoop} from '@luma.gl/core';

// This code could be folded into the core animation loop
export default class DisplayAnimationLoop extends AnimationLoop {
  finalize() {
    this._setDisplay(null);
  }

  _setDisplay(display) {
    if (this.display) {
      this.display.finalize();
      this.display.animationLoop = null;
    }

    // store animation loop on the display
    if (display) {
      display.animationLoop = this;
    }

    this.display = display;
  }

  _renderFrame(...args) {
    if (this.display) {
      return this.display._renderFrame(...args);
    }
    return super._renderFrame(...args);
  }

  _requestAnimationFrame(renderFrame) {
    if (this.display && this.display.requestAnimationFrame(renderFrame)) {
      return;
    }

    super._requestAnimationFrame(renderFrame);
  }
}
