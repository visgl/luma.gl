import MathArray from './math-array';
import {checkNumber} from './common';
import {vec4} from 'gl-matrix';

export default class Vector4 extends MathArray {
  // Creates a new, empty vec4
  constructor(x = 0, y = 0, z = 0, w = 0) {
    super();
    if (Array.isArray(x) && arguments.length === 1) {
      this.copy(x);
    } else {
      this.set(x, y, z, w);
    }
  }

  set(x, y, z, w) {
    vec4.set(this, x, y, z, w);
    this.check();
    return this;
  }

  equals(vector) {
    return vec4.equals(this, vector);
  }

  exactEquals(vector) {
    return vec4.exactEquals(this, vector);
  }

  // Getters/setters
  /* eslint-disable no-multi-spaces, brace-style, no-return-assign */
  get ELEMENTS() { return 4; }
  get x()      { return this[0]; }
  set x(value) { return this[0] = checkNumber(value); }
  get y()      { return this[1]; }
  set y(value) { return this[1] = checkNumber(value); }
  get z()      { return this[2]; }
  set z(value) { return this[2] = checkNumber(value); }
  get w()      { return this[3]; }
  set w(value) { return this[3] = checkNumber(value); }
  /* eslint-enable no-multi-spaces, brace-style, no-return-assign */

  distance(vector) {
    return vec4.distance(vector);
  }

  dist(vector) {
    return vec4.dist(vector);
  }

  angle(vector) {
    return vec4.angle(vector);
  }

  add(...vectors) {
    for (const vector of vectors) {
      vec4.add(this, vector);
    }
    this.check();
    return this;
  }

  subtract(...vectors) {
    for (const vector of vectors) {
      vec4.subtract(this, vector);
    }
    this.check();
    return this;
  }

  multiply(...vectors) {
    for (const vector of vectors) {
      vec4.multiply(this, vector);
    }
    this.check();
    return this;
  }

  divide(...vectors) {
    for (const vector of vectors) {
      vec4.divide(this, vector);
    }
    this.check();
    return this;
  }

  ceil() {
    vec4.ceil(this, this);
    this.check();
    return this;
  }

  floor() {
    vec4.floor(this, this);
    this.check();
    return this;
  }

  min() {
    vec4.min(this, this);
    this.check();
    return this;
  }

  max() {
    vec4.max(this, this);
    this.check();
    return this;
  }

  scale(scale) {
    vec4.scale(this, this, scale);
    this.check();
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec4.scaleAndAdd(this, this, vector, scale);
    this.check();
    return this;
  }

  negate() {
    vec4.negate(this, this);
    this.check();
    return this;
  }

  inverse() {
    vec4.inverse(this, this);
    this.check();
    return this;
  }

  normalize() {
    vec4.normalize(this, this);
    this.check();
    return this;
  }

  dot(scale) {
    vec4.dot(this, this, scale);
    this.check();
    return this;
  }

  cross(scale) {
    vec4.cross(this, this, scale);
    this.check();
    return this;
  }

  lerp(scale) {
    vec4.lerp(this, this, scale);
    this.check();
    return this;
  }

  hermite(scale) {
    vec4.hermite(this, this, scale);
    this.check();
    return this;
  }

  bezier(scale) {
    vec4.bezier(this, this, scale);
    this.check();
    return this;
  }

  random(scale) {
    vec4.random(this, this, scale);
    this.check();
    return this;
  }

  rotateX(origin, angle) {
    vec4.rotateX(this, this, origin, angle);
    this.check();
    return this;
  }

  rotateY(origin, angle) {
    vec4.rotateY(this, this, origin, angle);
    this.check();
    return this;
  }

  rotateZ(origin, angle) {
    vec4.rotateZ(this, this, origin, angle);
    this.check();
    return this;
  }
}
