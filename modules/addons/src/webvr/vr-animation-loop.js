/* global window, navigator */
import {AnimationLoop, withParameters, log} from '@luma.gl/core';
import {createEnterVRButton} from './utils';

export default class VRAnimationLoop extends AnimationLoop {
  onInitialize(...args) {
    this._enableWebVR();
    return super.onInitialize(...args);
  }

  onRender(options) {
    const {width, height} = options;

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

      const leftEyeParams = Object.assign({}, options, {
        vrEye: 'left',
        vrProjectionMatrix: leftProjectionMatrix,
        vrViewMatrix: leftViewMatrix
      });
      withParameters(
        this.gl,
        {
          viewport: [0, 0, width * 0.5, height],
          scissor: [0, 0, width * 0.5, height],
          scissorTest: true
        },
        () => super.onRender(leftEyeParams)
      );

      const rightEyeParams = Object.assign({}, options, {
        vrEye: 'right',
        vrProjectionMatrix: rightProjectionMatrix,
        vrViewMatrix: rightViewMatrix
      });
      withParameters(
        this.gl,
        {
          viewport: [width * 0.5, 0, width * 0.5, height],
          scissor: [width * 0.5, 0, width * 0.5, height],
          scissorTest: true
        },
        () => super.onRender(rightEyeParams)
      );

      this.vrDisplay.submitFrame();
      return true;
    }

    this.gl.viewport(0, 0, width, height);
    return super.onRender(options);
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

  async _enableWebVR() {
    this.vrSupported = 'getVRDisplays' in navigator && window.VRFrameData;
    if (!this.vrSupported) return;

    this.vrFrameData = new window.VRFrameData();
    this.vrPresenting = false;
    this.vrFrame = false;

    const displays = await navigator.getVRDisplays();
    if (displays && displays.length) {
      log.info(2, 'Found VR Displays', displays)();

      // TODO: Consider resizing canvas to match vrDisplay.getEyeParameters()
      // TODO: Maybe allow to select display?

      this.vrDisplay = displays[0];
      this.vrButton = createEnterVRButton({
        canvas: this.gl.canvas,
        title: `Enter VR (${this.vrDisplay.displayName})`
      });
      this.vrButton.onclick = () => this.enterWebVR();

      window.addEventListener('vrdisplaypresentchange', this._vrDisplayPresentChange.bind(this));
    }
  }

  _requestAnimationFrame(renderFrame) {
    if (this.vrPresenting) {
      this.vrDisplay.requestAnimationFrame(() => {
        this.vrFrame = true;
        renderFrame();
        this.vrFrame = false;
      });
    } else {
      super._requestAnimationFrame(renderFrame);
    }
  }

  enterWebVR() {
    this.vrDisplay.requestPresent([
      {
        source: this.gl.canvas
      }
    ]);
  }
}
