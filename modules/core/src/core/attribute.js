/* eslint-disable complexity */
import GL from '@luma.gl/constants';
import {Accessor, Buffer} from '../webgl';
import {log, uid} from '../utils';
import {hasFeature, FEATURES} from '../webgl/features';

const ACCESSOR_DEFAULTS = {
  offset: 0,
  stride: 0,
  normalized: false,
  integer: false,
  divisor: 0
};

export default class Attribute {
  constructor(gl, props = {}) {
    const {id = uid('attribute'), type, isIndexed = false} = props;

    // Options that cannot be changed later
    this.gl = gl;
    this.id = id;

    this.isIndexed = isIndexed;
    this.target = isIndexed ? GL.ELEMENT_ARRAY_BUFFER : GL.ARRAY_BUFFER;

    this.constant = false;
    this.value = null;
    this.externalBuffer = null;
    this.buffer = null;
    this.userData = {}; // Reserved for application
    this.accessor = new Accessor(ACCESSOR_DEFAULTS);

    // NOTE: this line will copy inline accessor props / props.accessor to this.accessor
    this.update(props);

    // Update the attribute accessor
    const accessorFields = {type};
    // If the attribute contains indices, auto infer the correct type
    // WebGL2 and WebGL1 w/ uint32 index extension support accepts Uint32Array, otherwise Uint16Array
    if (isIndexed && !type) {
      accessorFields.type =
        accessorFields.type || (gl && hasFeature(gl, FEATURES.ELEMENT_INDEX_UINT32))
          ? GL.UNSIGNED_INT
          : GL.UNSIGNED_SHORT;
    }

    this.accessor = new Accessor(this.accessor, accessorFields);

    // Sanity - don't allow app fields. Use userData instead.
    Object.seal(this);
  }

  delete() {
    if (this.buffer) {
      this.buffer.delete();
      this.buffer = null;
    }
  }

  update(props) {
    // TODO - refactored this code
    // const {constant = this.constant || false} = props;
    //  this.constant = constant;
    if ('constant' in props) {
      this.constant = Boolean(props.constant);
    }

    if (props.buffer) {
      this._setExternalBuffer(props.buffer);
    } else if (props.value) {
      if (this.constant) {
        this._setConstant(props.value);
      } else {
        this._setBuffer(props.value, props);
      }
    }

    if (props.accessor) {
      this.accessor = new Accessor(props.accessor);
    }

    this._setAccessorFromInlineProps(props);
  }

  getBuffer() {
    if (this.constant) {
      return null;
    }
    return this.externalBuffer || this.buffer;
  }

  getValue() {
    if (this.constant) {
      return this.value;
    }
    const buffer = this.externalBuffer || this.buffer;
    if (buffer) {
      return [buffer, this.accessor];
    }
    return null;
  }

  // PRIVATE HELPERS

  _setExternalBuffer(buffer) {
    this.externalBuffer = buffer;
    this.constant = false;

    const accessorFields = {};
    accessorFields.type = buffer.accessor.type;
    if (buffer.accessor.divisor !== undefined) {
      accessorFields.divisor = buffer.accessor.divisor;
    }

    this.accessor = new Accessor(this.accessor, accessorFields);
  }

  _setBuffer(value, props) {
    this.externalBuffer = null;
    this.value = value;

    if (this.gl) {
      // Create buffer if needed
      if (!this.buffer) {
        this.buffer = new Buffer(
          this.gl,
          Object.assign({}, props, {
            id: this.id,
            target: this.target,
            type: this.accessor.type
          })
        );
      }
      this.buffer.setData({data: value});
      this.accessor = new Accessor(this.accessor, {type: this.buffer.accessor.type});
    }
  }

  _setConstant(value) {
    this.externalBuffer = null;
    this.value = value;
  }

  // DEPRECATED: Sets all accessor fields from inline props except type
  _setAccessorFromInlineProps(props) {
    this.accessor = new Accessor(this.accessor, props);
  }

  // TEMPORARY - Keep deck.gl from breaking - remove as soon as tested
  get type() {
    log.deprecated('Attribute.type', 'Attribute.accessor.type')();
    return this.accessor.type;
  }

  set type(value) {
    log.deprecated('Attribute.type', 'Attribute.accessor.type')();
    this.accessor.type = value;
  }

  get size() {
    log.deprecated('Attribute.size', 'Attribute.accessor.size')();
    return this.accessor.size;
  }

  set size(value) {
    log.deprecated('Attribute.size', 'Attribute.accessor.size')();
    this.accessor.size = value;
  }

  get offset() {
    log.deprecated('Attribute.offset', 'Attribute.accessor.offset')();
    return this.accessor.offset;
  }

  set offset(value) {
    log.deprecated('Attribute.offset', 'Attribute.accessor.offset')();
    this.accessor.offset = value;
  }

  get stride() {
    log.deprecated('Attribute.stride', 'Attribute.accessor.stride')();
    return this.accessor.stride;
  }

  set stride(value) {
    log.deprecated('Attribute.stride', 'Attribute.accessor.stride')();
    this.accessor.stride = value;
  }

  get normalized() {
    log.deprecated('Attribute.normalized', 'Attribute.accessor.normalized')();
    return this.accessor.normalized;
  }

  set normalized(value) {
    log.deprecated('Attribute.normalized', 'Attribute.accessor.normalized')();
    this.accessor.normalized = value;
  }

  get integer() {
    log.deprecated('Attribute.integer', 'Attribute.accessor.integer')();
    return this.accessor.integer;
  }

  set integer(value) {
    log.deprecated('Attribute.integer', 'Attribute.accessor.integer')();
    this.accessor.integer = value;
  }

  get divisor() {
    log.deprecated('Attribute.divisor', 'Attribute.accessor.divisor')();
    return this.accessor.divisor;
  }

  set divisor(value) {
    log.deprecated('Attribute.divisor', 'Attribute.accessor.divisor')();
    this.accessor.divisor = value;
  }
}
