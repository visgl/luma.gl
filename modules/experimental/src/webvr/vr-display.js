/* global window, navigator */
import {log} from '@luma.gl/core';
import Display from './display';
import {createEnterVRButton} from './vr-button';

export default class VRDisplay extends Display {
  static isSupported() {
    return (
      typeof navigator !== 'undefined' && 'getVRDisplays' in navigator && 'VRFrameData' in window
    );
  }

  constructor(props) {
    super(props);

    this._vrSupported = VRDisplay.isSupported();
    if (this._vrSupported) {
      this.vrFrameData = new window.VRFrameData();
      this.vrPresenting = false;
      this.vrFrame = false;
      window.addEventListener('vrdisplaypresentchange', this._vrDisplayPresentChange.bind(this));
    }
  }

  delete() {
    super.delete();
    this._removeVRButton();
  }

  getViews(options) {
    if (this._vrSupported) {
      this._addVRButton();
    }

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

      const {width, height} = options;

      return [
        {
          displayEye: 'left',
          projectionMatrix: leftProjectionMatrix,
          viewMatrix: leftViewMatrix,
          params: {
            viewport: [0, 0, width * 0.5, height],
            scissor: [0, 0, width * 0.5, height],
            scissorTest: true
          }
        },
        {
          displayEye: 'right',
          projectionMatrix: rightProjectionMatrix,
          viewMatrix: rightViewMatrix,
          params: {
            viewport: [width * 0.5, 0, width * 0.5, height],
            scissor: [width * 0.5, 0, width * 0.5, height],
            scissorTest: true
          }
        }
      ];
    }

    return super.getViews(options);
  }

  submitFrame() {
    if (this.vrPresenting && this.vrFrame) {
      this.vrDisplay.submitFrame();
      return true;
    }

    return false;
  }

  requestAnimationFrame(renderFrame) {
    if (this.vrPresenting) {
      this.vrDisplay.requestAnimationFrame(() => {
        this.vrFrame = true;
        renderFrame();
        this.vrFrame = false;
      });

      return true;
    }

    return false;
  }

  // PRIVATE

  // TODO: Consider resizing canvas to match vrDisplay.getEyeParameters()
  // TODO: Maybe allow to select display?
  async _addVRButton() {
    if (this.vrButton) {
      return;
    }

    const canvas = this._getCanvas();
    if (!canvas) {
      return;
    }

    const displays = await navigator.getVRDisplays();
    if (displays && displays.length) {
      log.info(2, 'Found VR Displays', displays)();

      this.vrDisplay = displays[0];
      this.vrButton = createEnterVRButton({
        canvas,
        title: `Enter VR (${this.vrDisplay.displayName})`
      });
      this.vrButton.onclick = () => this._startDisplay();
    }
  }

  _getCanvas() {
    return this.animationLoop.canvas || (this.animationLoop.gl && this.animationLoop.gl.canvas);
  }

  _removeVRButton() {
    if (this.vrButton) {
      // TODO
    }
  }

  _startDisplay() {
    this.vrDisplay.requestPresent([
      {
        source: this._getCanvas()
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
