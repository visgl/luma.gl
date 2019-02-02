import Texture from './texture';
import {isWebGL2} from '../utils';

export default class Texture2DArray extends Texture {
  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl, opts = {}) {
    super(gl, opts);
    throw new Error('Texture2DArray not yet implemented');
  }
}
