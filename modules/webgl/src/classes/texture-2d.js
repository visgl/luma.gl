import GL from '@luma.gl/constants';
import {assertWebGLContext} from '@luma.gl/gltools';
import Texture from './texture';
import {loadImage} from '../utils/load-file';

export default class Texture2D extends Texture {
  // eslint-disable-next-line accessor-pairs
  get [Symbol.toStringTag]() {
    return 'Texture2D';
  }

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

    super(gl, Object.assign({}, props, {target: GL.TEXTURE_2D}));

    this.initialize(props);

    Object.seal(this);
  }
}
