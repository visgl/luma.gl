// A convolution render pass
// Based on https://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html

import {_Pass as Pass, ClipSpaceQuad} from 'luma.gl';
import convolution from '../modules/convolution';

export default class ConvolutionPass extends Pass {

  static get KERNEL() {
    return convolution.KERNEL;
  }

  constructor(gl, props = {}) {
    super(gl, Object.assign({
      id: 'convolution-pass',
      swap: true,
      kernel: convolution.KERNEL.NORMAL
    }, props));

    this.clipspace = new ClipSpaceQuad(gl, {
      id: 'convolution-pass',
      modules: [convolution],
      fs: `
        uniform sampler2D tDiffuse;
        varying vec2 uv; // the texCoords passed in from the vertex shader.
        void main() {
          gl_FragColor = convolution_getColor(tDiffuse, uv);
        }
      `
    });

    this.setProps(props);
  }

  setProps(props) {
    Object.assign(this.props, props);
    this.clipspace.setUniforms({
      uKernel: this.props.kernel,
      uKernelWeight: this.props.kernel.reduce((sum, x) => sum + x, 0)
    });
  }

  _renderPass({inputBuffer, outputBuffer}) {
    const {width, height} = inputBuffer;
    this.clipspace.draw({
      uniforms: {
        tDiffuse: inputBuffer,
        uTextureSize: [width, height]
      },
      parameters: {
        depthWrite: false,
        depthTest: false
      }
    });
  }
}
