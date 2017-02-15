import {GL} from './webgl';
import {assertWebGLContext} from './webgl-checks';
import Texture from './texture';

export default class TextureCube extends Texture {

  static makeFrom(gl, object = {}) {
    return object instanceof TextureCube ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new TextureCube(gl, {handle: object.handle || object});
  }

  constructor(gl, opts = {}) {
    assertWebGLContext(gl);
    super(gl, Object.assign({}, opts, {target: GL.TEXTURE_CUBE_MAP}));
    this.setCubeMapImageData(opts);
  }

  bind({index} = {}) {
    const {gl} = this;
    if (index !== undefined) {
      gl.activeTexture(GL.TEXTURE0 + index);
    }
    gl.bindTexture(GL.TEXTURE_CUBE_MAP, this.handle);
    if (index === undefined) {
      const result = gl.getParameter(gl.ACTIVE_TEXTURE) - GL.TEXTURE0;
      return result;
    }
    return index;
  }

  unbind() {
    const {gl} = this;
    gl.bindTexture(GL.TEXTURE_CUBE_MAP, null);
  }

  /* eslint-disable max-statements, max-len */
  setCubeMapImageData({
    width,
    height,
    pixels,
    data,
    border = 0,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
    generateMipmap = false
  }) {
    const {gl} = this;
    pixels = pixels || data;
    this.bind();
    if (this.width || this.height) {
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_X,
        0, format, width, height, border, format, type, pixels.pos.x);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
        0, format, width, height, border, format, type, pixels.pos.y);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
        0, format, width, height, border, format, type, pixels.pos.z);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
        0, format, width, height, border, format, type, pixels.neg.x);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        0, format, width, height, border, format, type, pixels.neg.y);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        0, format, width, height, border, format, type, pixels.neg.z);
    } else {
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_X,
        0, format, format, type, pixels.pos.x);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
        0, format, format, type, pixels.pos.y);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
        0, format, format, type, pixels.pos.z);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
        0, format, format, type, pixels.neg.x);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        0, format, format, type, pixels.neg.y);
      gl.texImage2D(GL.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        0, format, format, type, pixels.neg.z);
    }

    this.unbind();

    if (generateMipmap) {
      this.generateMipmap();
    }
    return this;
  }
}
