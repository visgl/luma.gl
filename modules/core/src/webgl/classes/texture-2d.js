import GL from '@luma.gl/constants';
import Texture from './texture';
import {assertWebGLContext} from '../utils';
import {loadImage} from '../../core/load-file';

export default class Texture2D extends Texture {
  static isSupported(gl, opts) {
    return Texture.isSupported(gl, opts);
  }

  constructor(gl, props = {}) {
    assertWebGLContext(gl);

    // Signature: new Texture2D(gl, url | Promise)
    if (props instanceof Promise || typeof props === 'string') {
      props = {data: props};
    }
    // Signature: new Texture2D(gl, {data: url})
    if (typeof props.data === 'string') {
      props = Object.assign({}, props, {data: loadImage(props.data)});
    }

    super(gl, Object.assign({}, props, {target: gl.TEXTURE_2D}));

    this.initialize(props);

    Object.seal(this);
  }

  // target cannot be modified by bind:
  // textures are special because when you first bind them to a target,
  // they get special information. When you first bind a texture as a
  // GL_TEXTURE_2D, you are actually setting special state in the texture.
  // You are saying that this texture is a 2D texture.
  // And it will always be a 2D texture; this state cannot be changed ever.
  // If you have a texture that was first bound as a GL_TEXTURE_2D,
  // you must always bind it as a GL_TEXTURE_2D;
  // attempting to bind it as GL_TEXTURE_1D will give rise to an error
  // (while run-time).

  bind(textureUnit = this.textureUnit) {
    const {gl} = this;
    if (textureUnit === undefined) {
      throw new Error('Texture.bind: must specify texture unit');
    }
    this.textureUnit = textureUnit;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(this.target, this.handle);
    return textureUnit;
  }

  unbind() {
    const {gl} = this;
    if (this.textureUnit === undefined) {
      throw new Error('Texture.unbind: texture unit not specified');
    }
    gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
    gl.bindTexture(this.target, null);
    return this.textureUnit;
  }

  getActiveUnit() {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }
}
