const GL_FLOAT = 0x1406;

export default class Accessor {

  static get defaultOptions() {
    return {
      type: GL_FLOAT,
      size: 1,
      offset: 0,
      stride: 0,
      normalized: false,
      integer: false,
      instanced: 0
    };
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
  constructor(...optsList) {
    optsList.forEach(opts => this._update(opts));
  }

  // Combine with other accessors
  getOptions(...optsList) {
    const combinedOpts = Object.assign({}, Accessor.defaultOptions, this);
    optsList.forEach(opts => this._update(opts, combinedOpts));
    return combinedOpts;
  }

  update(opts) {
    this._update(opts);
    return this;
  }

  /* eslint-disable complexity */
  _update(opts = {}, target = this) {
    if (opts.type !== undefined) {
      target.type = opts.type;
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
    return target;
  }
  /* eslint-enable complexity */
}
