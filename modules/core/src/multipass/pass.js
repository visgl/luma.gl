//
// A base render pass.
//
// Attribution: This class and the multipass system were inspired by
// the THREE.js EffectComposer and *Pass classes

import {Framebuffer} from '../webgl';
import {withParameters} from '../webgl-context';

export default class Pass {
  constructor(gl, props) {
    const {id = 'pass'} = props;
    this.id = id; // id of this pass
    this.gl = gl;
    this.props = {enabled: true, screen: false, swap: false};
    Object.assign(this.props, props);
  }

  setProps(props) {
    Object.assign(this.props, props);
  }

  render(renderState, animationProps) {
    if (!this.props.enabled) {
      return;
    }

    const gl = this.gl;

    const renderParams = {
      gl,
      outputBuffer: renderState.writeBuffer,
      inputBuffer: renderState.readBuffer,
      animationProps,
      swapBuffers: () => renderState._swapFramebuffers()
    };

    if (this.props.screen) {
      renderParams.inputBuffer = renderParams.outputBuffer;
      renderParams.outputBuffer = Framebuffer.getDefaultFramebuffer(gl);
    } else if (this.props.swap) {
      renderParams.inputBuffer = renderState.writeBuffer;
      renderParams.outputBuffer = renderState.readBuffer;
    }

    withParameters(gl, {framebuffer: renderParams.outputBuffer}, () =>
      this._renderPass(renderParams)
    );

    if (this.props.debug) {
      renderParams.outputBuffer.log(0, this.id);
    }

    if (this.props.swap) {
      renderState._swapFramebuffers();
    }
  }

  /**
   * Renders the effect.
   * This is an abstract method that should be overridden.
   * @param {Framebuffer} inputBuffer - Frame buffer that contains the result of the previous pass
   * @param {Framebuffer} outputBuffer - Frame buffer that serves as the output render target
   */
  _renderPass({gl, inputBuffer, outputBuffer, animationProps}) {
    // assert(false, 'Draw/render methods not implemented!');
  }
}
