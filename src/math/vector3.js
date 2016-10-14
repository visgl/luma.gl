import {vec3} from 'gl-matrix';

import {unary, binary, spread} from './utils/decorators';
import {validateVector3, checkVector3} from './utils/validators';

export default class Vector3 extends Array {
  // Creates a new, empty vec3
  constructor(x = 0, y = 0, z = 0) {
    super();
    this[0] = x;
    this[1] = y;
    this[2] = z;
  }

  set(x, y, z) {
    vec3.set(this, x, y, z);
    return this;
  }

  copy(vector) {
    vec3.copy(this, vector);
    return this;
  }

  @unary
  clone() {
    const clone = vec3.clone(new Vector3(), this);
    checkVector3(clone);
    return clone;
  }

  @unary
  toString() {
    return vec3.str(this);
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
    return vec3.equals(this, vector);
  }

  @binary
  exactEquals(vector) {
    return vec3.exactEquals(this, vector);
  }

  validate() {
    return validateVector3(this);
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

  @binary
  distance(vector) {
    return vec3.distance(vector);
  }

  @binary
  dist(vector) {
    return vec3.dist(vector);
  }

  @binary
  angle(vector) {
    return vec3.angle(vector);
  }

  @spread
  add(...vectors) {
    for (const vector of vectors) {
      vec3.add(this, vector);
    }
    return this;
  }

  @spread
  subtract(...vectors) {
    for (const vector of vectors) {
      vec3.subtract(this, vector);
    }
    return this;
  }

  @spread
  sub(...vectors) {
    return this.subtract(vectors);
  }

  @spread
  multiply(...vectors) {
    for (const vector of vectors) {
      vec3.multiply(this, vector);
    }
    return this;
  }

  @spread
  divide(...vectors) {
    for (const vector of vectors) {
      vec3.divide(this, vector);
    }
    return this;
  }

  @unary
  ceil() {
    vec3.ceil(this, this);
    return this;
  }

  @unary
  floor() {
    vec3.floor(this, this);
    return this;
  }

  @unary
  min() {
    vec3.min(this, this);
    return this;
  }

  @unary
  max() {
    vec3.max(this, this);
    return this;
  }

  @binary
  scale(scale) {
    vec3.scale(this, this, scale);
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec3.scaleAndAdd(this, this, vector, scale);
    return this;
  }

  @binary
  negate() {
    vec3.negate(this, this);
    return this;
  }

  @binary
  inverse() {
    vec3.inverse(this, this);
    return this;
  }

  @binary
  normalize() {
    vec3.normalize(this, this);
    return this;
  }

  @binary
  dot(scale) {
    vec3.dot(this, this, scale);
    return this;
  }

  @binary
  cross(scale) {
    vec3.cross(this, this, scale);
    return this;
  }

  lerp(scale) {
    vec3.lerp(this, this, scale);
    return this;
  }

  hermite(scale) {
    vec3.hermite(this, this, scale);
    return this;
  }

  bezier(scale) {
    vec3.bezier(this, this, scale);
    return this;
  }

  random(scale) {
    vec3.cross(this, this, scale);
    return this;
  }

  rotateX(origin, angle) {
    vec3.rotateX(this, this, origin, angle);
    return this;
  }

  rotateY(origin, angle) {
    vec3.rotateY(this, this, origin, angle);
    return this;
  }

  rotateZ(origin, angle) {
    vec3.rotateZ(this, this, origin, angle);
    checkVector3(this);
    return this;
  }
}
