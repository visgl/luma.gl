import {formatValue, equals, glMatrix} from './common';

export default class MathArray extends Array {

  clone() {
    const Subclass = this.constructor;
    const clone = new Subclass().copy(this);
    clone.check();
    return clone;
  }

  copy(array) {
    for (let i = 0; i < this.ELEMENTS; ++i) {
      this[i] = array[i];
    }
    this.check();
    return this;
  }

  set(...args) {
    for (let i = 0; i < this.ELEMENTS; ++i) {
      this[i] = args[i] || 0;
    }
    this.check();
    return this;
  }

  fromArray(array, offset = 0) {
    for (let i = 0; i < this.ELEMENTS; ++i) {
      this[i] = array[i + offset];
    }
    this.check();
    return this;
  }

  toString() {
    let string = '';
    for (let i = 0; i < this.ELEMENTS; ++i) {
      string += (i > 0 ? ', ' : '') + formatValue(this[i]);
    }
    return `${this.constructor.name}(${string})`;
  }

  toArray(array = [], offset = 0) {
    for (let i = 0; i < this.ELEMENTS; ++i) {
      array[offset + i] = this[i];
    }
    return array;
  }

  toFloat32Array() {
    return new Float32Array(this);
  }

  equals(array) {
    if (this.length !== array.length) {
      return false;
    }
    for (let i = 0; i < this.ELEMENTS; ++i) {
      if (!equals(this[i], array[i])) {
        return false;
      }
    }
    return true;
  }

  exactEquals(array) {
    if (this.length !== array.length) {
      return false;
    }
    for (let i = 0; i < this.ELEMENTS; ++i) {
      if (this[i] !== array[i]) {
        return false;
      }
    }
    return true;
  }

  validate(array = this) {
    let valid = array.length === this.ELEMENTS;
    for (let i = 0; i < this.ELEMENTS; ++i) {
      valid = valid && Number.isFinite(array[i]);
    }
    return valid;
  }

  check(array = this) {
    if (glMatrix.debug && !this.validate(array)) {
      throw new Error(`Invalid ${this.constructor.name}`);
    }
  }
}
