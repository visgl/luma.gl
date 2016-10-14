import {vec2} from 'gl-matrix';

import {unary, binary, spread} from './utils/decorators';
import {validateVector2, checkVector2} from './utils/validators';

export default class Vector2 extends Array {
  // Creates a new, empty vec2
  constructor(x = 0, y = 0) {
    super();
    this[0] = x;
    this[1] = y;
    checkVector2(this);
  }

  set(x, y, z) {
    vec2.set(this, x, y, z);
    checkVector2(this);
    return this;
  }

  copy(vector) {
    vec2.copy(this, vector);
    checkVector2(this);
    return this;
  }

  clone() {
    const clone = vec2.copy(new Vector2(), this);
    checkVector2(clone);
    return clone;
  }

  @unary
  toString() {
    return vec2.str(this);
  }

  @unary
  toArray() {
    return this;
  }

  @unary
  toFloat32Array() {
    return new Float32Array(this);
  }

  @binary
  equals(vector) {
    return vec2.equals(this, vector);
  }

  @binary
  exactEquals(vector) {
    return vec2.exactEquals(this, vector);
  }

  validate() {
    return validateVector2(this);
  }

  // Getters/setters
  get x() {
    return this[0];
  }

  set x(value) {
    this[0] = value;
    return this;
  }

  get y() {
    return this[1];
  }

  set y(value) {
    this[1] = value;
    return this;
  }

  @spread
  add(...vectors) {
    for (const vector of vectors) {
      vec2.add(this, vector);
    }
    return this;
  }
}
