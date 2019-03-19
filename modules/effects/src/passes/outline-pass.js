/**
 * A traditional stencil buffer based outline pass.
 */

import GL from '@luma.gl/constants';
import {_Pass as Pass, withParameters, setParameters} from '@luma.gl/core';

export default class OutlinePass extends Pass {
  constructor(gl, props = {}) {
    super(gl, Object.assign({id: 'simple-outline-pass'}, props));
    this.setProps(props);
  }

  setProps(props) {
    this.props = Object.assign(this.props, props);
    // this.clipspace.setUniforms(pixelation.getUniforms(this.props));
  }

  _renderPass({gl, animationProps}) {
    withParameters(
      gl,
      {
        stencilTest: true, // turn on stencil buffers
        stencilOp: [GL.KEEP, GL.KEEP, GL.REPLACE] // update stencil if both stencil+depth tests pass
      },
      () => {
        // Enable writing to stencil buffer plane 0
        setParameters(gl, {
          stencilFunc: [GL.ALWAYS, 1, 0xff], // update stencil buffer, regardless of current value
          stencilMask: 0x01
        });

        gl.clear(GL.STENCIL_BUFFER_BIT);

        // draw
        for (const model of this.props.models) {
          model.setUniforms(this.props.normalUniforms);
          model.draw(this.props.drawParams);
        }

        // Disable stencil writing, mask to stencil plane 0
        setParameters(gl, {
          stencilFunc: [GL.NOTEQUAL, 1, 0x01],
          stencilMask: 0x00, // disable writing to the stencil buffer
          depthTest: false
        });

        for (const model of this.props.models) {
          model.setUniforms(this.props.outlineUniforms);
          model.draw(this.props.drawParams);
          model.setUniforms(this.props.normalUniforms);
        }

        // All GL settings will reset here...
      }
    );
  }
}
