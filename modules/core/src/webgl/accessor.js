import GL from '../constants';
import {getTypedArrayFromGLType} from '../webgl-utils/typed-array-utils';
import log from '../utils/log';
import assert from '../utils/assert';

const DEFAULT_ACCESSOR_VALUES = {
  offset: 0,
  stride: 0,
  type: GL.FLOAT,
  size: 1,
  divisor: 0,
  normalized: false,
  integer: false
};

export default class Accessor {
  static getBytesPerElement(accessor) {
    // TODO: using `FLOAT` when type is not specified,
    // ensure this assumption is valid or force API to specify type.
    const ArrayType = getTypedArrayFromGLType(accessor.type || GL.FLOAT);
    return ArrayType.BYTES_PER_ELEMENT;
  }

  static getBytesPerVertex(accessor) {
    assert(accessor.size);
    // TODO: using `FLOAT` when type is not specified,
    // ensure this assumption is valid or force API to specify type.
    const ArrayType = getTypedArrayFromGLType(accessor.type || GL.FLOAT);
    return ArrayType.BYTES_PER_ELEMENT * accessor.size;
  }

  // Combines (merges) a list of accessors. On top of default values
  // Usually [programAccessor, bufferAccessor, appAccessor]
  // All props will be set in the returned object.
  // TODO check for conflicts between values in the supplied accessors
  static resolve(...accessors) {
    return new Accessor(...[DEFAULT_ACCESSOR_VALUES, ...accessors]); // Default values
  }

  constructor(...accessors) {
    accessors.forEach(accessor => this._assign(accessor)); // Merge in sequence
    Object.freeze(this);
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

  // PRIVATE

  /* eslint-disable complexity, max-statements */
  _assign(props = {}) {
    // TYPE - not expected to be overridden
    if (props.type !== undefined) {
      if (this.type !== props.type) {
        log.warn('accessor type mismatch');
      }
      this.type = props.type;

      // Auto-deduce integer type?
      if (props.type === GL.INT || props.type === GL.UNSIGNED_INT) {
        this.integer = true;
      }
    }

    // SIZE - not expected to be overridden
    if (props.size !== undefined) {
      if (this.size !== props.size) {
        log.warn('accessor size mismatch');
      }
      this.size = props.size;
    }

    // INSTANCE DIVISOR
    if (props.divisor !== undefined) {
      this.divisor = props.divisor;
    }

    if (props.offset !== undefined) {
      this.offset = props.offset;
    }
    if (props.stride !== undefined) {
      this.stride = props.stride;
    }
    if (props.normalized !== undefined) {
      this.normalized = props.normalized;
    }
    if (props.integer !== undefined) {
      this.integer = props.integer;
    }

    // Backwards compatibility
    if (props.instanced !== undefined) {
      log.deprecated('Accessor.instanced', 'Accessor.divisor');
      this.divisor = props.instanced ? 1 : 0;
    }
    if (props.isInstanced !== undefined) {
      log.deprecated('Accessor.isInstanced', 'Accessor.divisor');
      this.divisor = props.isInstanced ? 1 : 0;
    }

    // TODO - should this be supported?
    if (props.index !== undefined) {
      this.index = props.index ? 1 : 0;
    }

    return this;
  }
  /* eslint-enable complexity, max-statements */
}

// TEST EXPORTS
export {DEFAULT_ACCESSOR_VALUES};
