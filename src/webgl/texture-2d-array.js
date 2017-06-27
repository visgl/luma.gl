// import GL from './api';
import {isWebGL2} from './context';
// import {isWebGl2Context, assertWebGL2Context, withParameters} from './context';
import Texture from '../webgl/texture';
// import Buffer from './buffer';

export default class Texture2DArray extends Texture {
  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl, opts = {}) {
    super(gl, opts);
    throw new Error('Texture2DArray not yet implemented');
  }
}
