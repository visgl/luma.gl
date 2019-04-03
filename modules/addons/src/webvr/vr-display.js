/* global window, navigator */
import {log} from '@luma.gl/core';
import Display from './display';
import {createEnterVRButton} from './vr-button';

export default class VRDisplay extends Display {
  static isSupported() {
    return 'getVRDisplays' in navigator && typeof window !== 'undefined' && window.VRFrameData;
  }

  constructor(props) {
    super(props);
    this.vrFrameData = new window.VRFrameData();
    this.vrPresenting = false;
    this.vrFrame = false;
    window.addEventListener('vrdisplaypresentchange', this._vrDisplayPresentChange.bind(this));
  }

  async attachDisplay(gl) {
    this.gl = gl;
    await this._addVRButton();
  }

  detachDisplay(gl) {
    this.gl = null;
    this._removeVRButton();
  }

  getViews(options) {
    // Need both vrPresenting and vrFrame
    // to avoid race conditions when we exit VR
    // after we schedule an animation frame
    if (this.vrPresenting && this.vrFrame) {
      this.vrDisplay.getFrameData(this.vrFrameData);

      const {
        leftProjectionMatrix,
        leftViewMatrix,
        rightProjectionMatrix,
        rightViewMatrix
      } = this.vrFrameData;

      return [
        {
          vrEye: 'left',
          vrProjectionMatrix: leftProjectionMatrix,
          vrViewMatrix: leftViewMatrix,
          viewport: [0, 0, 0.5, 1.0] // x, y, w, h
        },
        {
          vrEye: 'right',
          vrProjectionMatrix: rightProjectionMatrix,
          vrViewMatrix: rightViewMatrix,
          viewport: [0.5, 0, 0.5, 1.0] // x, y, w, h
        }
      ];
    }

    return null;
  }

  submitFrame() {
    this.vrDisplay.submitFrame();
    return true;
  }

  requestAnimationFrame(renderFrame) {
    if (this.vrPresenting) {
      this.vrDisplay.requestAnimationFrame(() => {
        this.vrFrame = true;
        renderFrame();
        this.vrFrame = false;
      });
    }
    return true;
  }

  // PRIVATE

  // TODO: Consider resizing canvas to match vrDisplay.getEyeParameters()
  // TODO: Maybe allow to select display?
  async _addVRButton() {
    const displays = await navigator.getVRDisplays();
    if (displays && displays.length) {
      log.info(2, 'Found VR Displays', displays)();

      this.vrDisplay = displays[0];
      this.vrButton = createEnterVRButton({
        canvas: this.gl.canvas,
        title: `Enter VR (${this.vrDisplay.displayName})`
      });
      this.vrButton.onclick = () => this.enterWebVR();
    }
  }

  _removeVRButton() {
    // TODO
  }

  _startDisplay() {
    this.vrDisplay.requestPresent([
      {
        source: this.gl.canvas
      }
    ]);
  }

  _vrDisplayPresentChange() {
    if (this.vrDisplay.isPresenting) {
      log.info(2, 'Entering VR')();

      this.vrPresenting = true;
      this.vrButton.style.display = 'none';
    } else {
      log.info(2, 'Exiting VR')();

      this.vrPresenting = false;
      this.vrButton.style.display = 'block';
    }
  }
}
