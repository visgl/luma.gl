import GL from '../constants';
import {getTypedArrayFromGLType} from '../webgl-utils/typed-array-utils';
import assert from '../utils/assert';

export default class Accessor {

  static get DEFAULTS() {
    return {
      type: GL.FLOAT,
      size: 1,
      offset: 0,
      stride: 0,
      normalized: false,
      integer: false,
      instanced: 0
    };
  }

  static getBytesPerElement(accessor) {
    assert(accessor.type);
    const ArrayType = getTypedArrayFromGLType(accessor.type);
    return ArrayType.BYTES_PER_ELEMENT;
  }

  static getBytesPerVertex(accessor) {
    assert(accessor.type && accessor.size);
    const ArrayType = getTypedArrayFromGLType(accessor.type);
    return ArrayType.BYTES_PER_ELEMENT * accessor.size;
  }

  /**
   * Store characteristics of a data accessor
   * This data can be used when updating vertex attributes with the associated buffer,
   * freeing the application from keeping track of this metadata.
   * @class
   * {type, size, offset, stride, normalized, integer, instanced}
   * @param {GLuint} size - number of values per element (1-4)
   * @param {GLuint} type - type of values (e.g. gl.FLOAT)
   * @param {GLbool} normalized=false - normalize integers to [-1,1] or [0,1]
   * @param {GLuint} integer=false - WebGL2 only, int-to-float conversion
   * @param {GLuint} stride=0 - supports strided arrays
   * @param {GLuint} offset=0 - supports strided arrays
   */
  constructor(...accessors) {
    accessors.forEach(opts => this._update(opts));
  }

  toString() {
    return JSON.stringify(this);
  }

  // ACCESSORS

  // TODO - remove>
  get BYTES_PER_ELEMENT() {
    return Accessor.getBytesPerElement(this);
  }

  get BYTES_PER_VERTEX() {
    return Accessor.getBytesPerVertex(this);
  }

  // MODIFIERS

  // Combine with other accessors
  merge(...accessors) {
    const combinedOpts = Object.assign({}, Accessor.DEFAULTS, this);
    accessors.forEach(options => this._update(options, combinedOpts));
    return combinedOpts;
  }

  getOptions(...accessors) {
    return this.merge(...accessors);
  }

  update(opts) {
    this._update(opts);
    return this;
  }

  // PRIVATE

  /* eslint-disable complexity */
  _update(opts = {}, target = this) {
    if (opts.type !== undefined) {
      target.type = opts.type;
      if (opts.type === GL.INT || opts.type === GL.UINT) {
        target.integer = true;
      }
    }
    if (opts.size !== undefined) {
      target.size = opts.size;
    }
    if (opts.offset !== undefined) {
      target.offset = opts.offset;
    }
    if (opts.stride !== undefined) {
      target.stride = opts.stride;
    }
    if (opts.normalized !== undefined) {
      target.normalized = opts.normalized;
    }
    if (opts.integer !== undefined) {
      target.integer = opts.integer;
    }
    if (opts.divisor !== undefined) {
      target.divisor = opts.divisor;
    }

    // Backwards compatibility
    if (opts.instanced !== undefined) {
      target.divisor = opts.instanced ? 1 : 0;
    }
    if (opts.isInstanced !== undefined) {
      target.divisor = opts.isInstanced ? 1 : 0;
    }
    // TODO - should this be supported?
    if (opts.index !== undefined) {
      target.index = opts.index ? 1 : 0;
    }
    return target;
  }
  /* eslint-enable complexity */
}
