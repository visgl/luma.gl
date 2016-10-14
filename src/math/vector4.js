import {vec4} from 'gl-matrix';

import {unary, binary, spread} from './utils/decorators';
import {validateVector4, checkVector4} from './utils/validators';

export default class Vector4 extends Array {
  // Creates a new, empty vec4
  constructor(x = 0, y = 0, z = 0, w = 0) {
    super();
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = w;
  }

  set(x, y, z) {
    vec4.set(this, x, y, z);
    return this;
  }

  copy(vector) {
    vec4.copy(this, vector);
    return this;
  }

  clone() {
    const clone = vec4.copy(new Vector4(), this);
    checkVector4(clone);
    return clone;
  }

  @unary
  toString() {
    return vec4.str(this);
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
    return vec4.equals(this, vector);
  }

  @binary
  exactEquals(vector) {
    return vec4.exactEquals(this, vector);
  }

  validate() {
    return validateVector4(this);
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

  get z() {
    return this[2];
  }

  set z(value) {
    this[2] = value;
    return this;
  }

  get w() {
    return this[3];
  }

  set w(value) {
    this[3] = value;
    return this;
  }

  @binary
  distance(vector) {
    return vec4.distance(vector);
  }

  @binary
  dist(vector) {
    return vec4.dist(vector);
  }

  @binary
  angle(vector) {
    return vec4.angle(vector);
  }

  @spread
  add(...vectors) {
    for (const vector of vectors) {
      vec4.add(this, vector);
    }
    return this;
  }

  @spread
  subtract(...vectors) {
    for (const vector of vectors) {
      vec4.subtract(this, vector);
    }
    return this;
  }

  @spread
  multiply(...vectors) {
    for (const vector of vectors) {
      vec4.multiply(this, vector);
    }
    return this;
  }

  @spread
  divide(...vectors) {
    for (const vector of vectors) {
      vec4.divide(this, vector);
    }
    return this;
  }

  ceil() {
    vec4.ceil(this, this);
    return this;
  }

  floor() {
    vec4.floor(this, this);
    return this;
  }

  min() {
    vec4.min(this, this);
    return this;
  }

  max() {
    vec4.max(this, this);
    return this;
  }

  scale(scale) {
    vec4.scale(this, this, scale);
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec4.scaleAndAdd(this, this, vector, scale);
    return this;
  }

  @unary
  negate() {
    vec4.negate(this, this);
    return this;
  }

  @unary
  inverse() {
    vec4.inverse(this, this);
    return this;
  }

  @unary
  normalize() {
    vec4.normalize(this, this);
    return this;
  }

  @binary
  dot(scale) {
    vec4.dot(this, this, scale);
    return this;
  }

  @binary
  cross(scale) {
    vec4.cross(this, this, scale);
    checkVector4(this);
    return this;
  }

  lerp(scale) {
    vec4.lerp(this, this, scale);
    checkVector4(this);
    return this;
  }

  hermite(scale) {
    vec4.hermite(this, this, scale);
    checkVector4(this);
    return this;
  }

  bezier(scale) {
    vec4.bezier(this, this, scale);
    checkVector4(this);
    return this;
  }

  random(scale) {
    vec4.random(this, this, scale);
    checkVector4(this);
    return this;
  }

  rotateX(origin, angle) {
    vec4.rotateX(this, this, origin, angle);
    checkVector4(this);
    return this;
  }

  rotateY(origin, angle) {
    vec4.rotateY(this, this, origin, angle);
    checkVector4(this);
    return this;
  }

  rotateZ(origin, angle) {
    vec4.rotateZ(this, this, origin, angle);
    checkVector4(this);
    return this;
  }
}
