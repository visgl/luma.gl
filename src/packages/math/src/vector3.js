import MathArray from './math-array';
import {checkNumber} from './common';
import {vec3} from 'gl-matrix';

export default class Vector3 extends MathArray {
  // Creates a new vec3, either empty, or from an array or from values
  constructor(x = 0, y = 0, z = 0) {
    super();
    if (Array.isArray(x) && arguments.length === 1) {
      this.copy(x);
    } else {
      this.set(x, y, z);
    }
  }

  static fromArray(array) {
    if (array instanceof Vector3) {
      return array;
    }
    return new Vector3(...array);
  }

  set(x, y, z) {
    vec3.set(this, x, y, z);
    this.check();
    return this;
  }

  equals(vector) {
    return vec3.equals(this, vector);
  }

  exactEquals(vector) {
    return vec3.exactEquals(this, vector);
  }

  // Getters/setters
  /* eslint-disable no-multi-spaces, brace-style, no-return-assign */
  get ELEMENTS() { return 3; }
  get x()      { return this[0]; }
  set x(value) { return this[0] = checkNumber(value); }
  get y()      { return this[1]; }
  set y(value) { return this[1] = checkNumber(value); }
  get z()      { return this[2]; }
  set z(value) { return this[2] = checkNumber(value); }
  /* eslint-enable no-multi-spaces, brace-style, no-return-assign */

  distance(vector) {
    return vec3.distance(vector);
  }

  dist(vector) {
    return vec3.dist(vector);
  }

  angle(vector) {
    return vec3.angle(vector);
  }

  // MODIFIERS

  add(...vectors) {
    for (const vector of vectors) {
      vec3.add(this, vector);
    }
    this.check();
    return this;
  }

  subtract(...vectors) {
    for (const vector of vectors) {
      vec3.subtract(this, vector);
    }
    this.check();
    return this;
  }

  multiply(...vectors) {
    for (const vector of vectors) {
      vec3.multiply(this, vector);
    }
    this.check();
    return this;
  }

  divide(...vectors) {
    for (const vector of vectors) {
      vec3.divide(this, vector);
    }
    this.check();
    return this;
  }

  ceil() {
    vec3.ceil(this, this);
    this.check();
    return this;
  }

  floor() {
    vec3.floor(this, this);
    this.check();
    return this;
  }

  min() {
    vec3.min(this, this);
    this.check();
    return this;
  }

  max() {
    vec3.max(this, this);
    this.check();
    return this;
  }

  scale(scale) {
    vec3.scale(this, this, scale);
    this.check();
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec3.scaleAndAdd(this, this, vector, scale);
    this.check();
    return this;
  }

  negate() {
    vec3.negate(this, this);
    this.check();
    return this;
  }

  inverse() {
    vec3.inverse(this, this);
    this.check();
    return this;
  }

  normalize() {
    vec3.normalize(this, this);
    this.check();
    return this;
  }

  dot(vector) {
    vec3.dot(this, this, vector);
    this.check();
    return this;
  }

  static dot(a, b) {
    return Vector3.fromArray(a).dot(b);
  }

  cross(vector) {
    vec3.cross(this, this, vector);
    this.check();
    return this;
  }

  static cross(a, b) {
    return Vector3.fromArray(a).cross(b);
  }

  lerp(scale) {
    vec3.lerp(this, this, scale);
    this.check();
    return this;
  }

  hermite(scale) {
    vec3.hermite(this, this, scale);
    this.check();
    return this;
  }

  bezier(scale) {
    vec3.bezier(this, this, scale);
    this.check();
    return this;
  }

  random(scale) {
    vec3.cross(this, this, scale);
    this.check();
    return this;
  }

  rotateX(origin, angle) {
    vec3.rotateX(this, this, origin, angle);
    this.check();
    return this;
  }

  rotateY(origin, angle) {
    vec3.rotateY(this, this, origin, angle);
    this.check();
    return this;
  }

  rotateZ(origin, angle) {
    vec3.rotateZ(this, this, origin, angle);
    this.check();
    return this;
  }
}
