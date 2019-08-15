import GL from '@luma.gl/constants';
import {
  Framebuffer
} from '@luma.gl/webgl';

export default class TextureTransformBinding {

  constructor(gl, props = {}) {

    this.gl = gl;

    // shader attribute name to Texture mapping
    this.sourceTextures = {};

    // target texture
    this.targetTexture = null;

    this.framebuffer = null;

    this.setProps(props);
  }

  setProps(props) {
    const {sourceTextures} = props;
    this.sourceTextures = Object.assign(this.sourceTextures, sourceTextures);
    this.setupFramebuffer(props);
  }

  // setup framebuffer object
  setupFramebuffer(props) {
    const {targetTexture} = props;
    if (!targetTexture) {
      return;
    }
    this.targetTexture = targetTexture;
    const {width, height} = targetTexture;
    if (this.framebuffer) {
      // First update texture without re-sizing attachments
      this.framebuffer.update({
        attachments: {[GL.COLOR_ATTACHMENT0]: targetTexture},
        resizeAttachments: false
      });
      // Resize to new taget texture size
      this.framebuffer.resize({width, height});
    } else {
      this.framebuffer = new Framebuffer(this.gl, {
        id: `${this.id || 'transform'}-framebuffer`,
        width,
        height,
        attachments: {
          [GL.COLOR_ATTACHMENT0]: targetTexture
        }
      });
    }
  }

  // return currently bound textures
  getResources() {
    const {sourceTextures, targetTexture, framebuffer} = this;
    return {sourceTextures, targetTexture, framebuffer};
  }
}
