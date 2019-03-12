import GL from '@luma.gl/constants';
import Texture from './texture';
import {isWebGL2, assertWebGL2Context} from '../utils';

export default class Texture3D extends Texture {
  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl, props = {}) {
    assertWebGL2Context(gl);
    props = Object.assign({}, props, {target: props.target || GL.TEXTURE_3D, unpackFlipY: false});
    super(gl, props);
    this.initialize(props);

    Object.seal(this);
  }
}
