/* eslint-disable complexity */
import GL from '../constants';
import {Buffer} from '../webgl';
import {uid} from '../utils';

export default class Attribute {
  constructor(gl, opts = {}) {
    const {
      id = uid('attribute'),
      type,
      isIndexed = false
    } = opts;

    // Options that cannot be changed later
    this.gl = gl;
    this.id = id;
    this.isIndexed = isIndexed;
    this.target = isIndexed ? GL.ELEMENT_ARRAY_BUFFER : GL.ARRAY_BUFFER;
    this.type = type;

    // Initialize the attribute descriptor, with WebGL and metadata fields
    this.value = null;
    this.externalBuffer = null;
    this.buffer = null;
    this.userData = {}; // Reserved for application
    this.update(opts);

    // Sanity - no app fields on our attributes. Use userData instead.
    Object.seal(this);

    // Check all fields and generate helpful error messages
    this._validateAttributeDefinition();
  }

  delete() {
    if (this.buffer) {
      this.buffer.delete();
      this.buffer = null;
    }
  }

  update(opts) {
    const {
      value,
      buffer,

      // buffer options
      size = this.size,
      offset = this.offset || 0,
      stride = this.stride || 0,
      normalized = this.normalized || false,
      integer = this.integer || false,
      instanced = this.instanced || 0,

      constant = this.constant || false,
      isInstanced
    } = opts;

    this.size = size;
    this.offset = offset;
    this.stride = stride;
    this.normalized = normalized;
    this.integer = integer;
    this.constant = constant;

    if (isInstanced !== undefined) {
      this.instanced = isInstanced ? 1 : 0;
    } else {
      this.instanced = instanced;
    }

    if (buffer) {
      this.externalBuffer = buffer;
      this.constant = false;

      this.type = buffer.accessor.type;
      if (buffer.accessor.divisor !== undefined) {
        this.instanced = buffer.accessor.divisor > 0;
      }
    } else if (value) {
      this.externalBuffer = null;
      this.value = value;

      if (!constant) {
        // Create buffer if needed
        this.buffer = this.buffer ||
          new Buffer(this.gl, Object.assign({}, opts, {
            id: this.id,
            target: this.target,
            type: this.type
          }));
        this.buffer.setData({data: value});
        this.type = this.buffer.accessor.type;
      }
    }
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
      return [buffer, this];
    }
    return null;
  }

  _validateAttributeDefinition() {
    // Can be undefined for buffers (auto deduced from shaders)
    // or larger than 4 for uniform arrays
    // assert(
    //   this.size >= 1 && this.size <= 4,
    //   `Attribute definition for ${this.id} invalid size`
    // );
  }
}
