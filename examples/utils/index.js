/* global window, document */

// Light class implementing the AnimationLoop interface
// use by examples w/o creating a gl context
export class MiniAnimationLoop {
  static getInfo() {
    return '';
  }

  start() {}

  stop() {}

  delete() {}

  _setDisplay() {}

  _getCanvas(props = {}) {
    let canvas;
    if (props.canvas) {
      canvas = document.getElementById(props.canvas);
      const dpr = window.devicePixelRatio || 1;
      canvas.height = canvas.clientHeight * dpr;
      canvas.width = canvas.clientWidth * dpr;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      document.body.appendChild(canvas);
    }

    return canvas;
  }
}

// Create a deterministic pseudorandom number generator
export function getRandom() {
  let s = 1;
  let c = 1;
  return () => {
    s = Math.sin(c * 17.23);
    c = Math.cos(s * 27.92);
    return fract(Math.abs(s * c) * 1432.71);
  };
}

function fract(n) {
  return n - Math.floor(n);
}
