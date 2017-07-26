import MathArray from './math-array';
import {checkNumber} from './common';

// gl-matrix is too big. Cherry-pick individual imports from stack.gl version
/* eslint-disable camelcase */
import vec4_set from 'gl-vec4/set';
import vec4_distance from 'gl-vec4/distance';
import vec4_add from 'gl-vec4/add';
import vec4_subtract from 'gl-vec4/subtract';
import vec4_multiply from 'gl-vec4/multiply';
import vec4_divide from 'gl-vec4/divide';
import vec4_scale from 'gl-vec4/scale';
import vec4_scaleAndAdd from 'gl-vec4/scaleAndAdd';
import vec4_negate from 'gl-vec4/negate';
import vec4_inverse from 'gl-vec4/inverse';
import vec4_normalize from 'gl-vec4/normalize';
import vec4_dot from 'gl-vec4/dot';
// import vec4_cross from 'gl-vec4/cross';
import vec4_lerp from 'gl-vec4/lerp';

export function validateVector4(v) {
  return v.length === 4 &&
    Number.isFinite(v[0]) && Number.isFinite(v[1]) &&
    Number.isFinite(v[2]) && Number.isFinite(v[3]);
}

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
    vec4_set(this, x, y, z, w);
    this.check();
    return this;
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
    return vec4_distance(vector);
  }

  add(...vectors) {
    for (const vector of vectors) {
      vec4_add(this, vector);
    }
    this.check();
    return this;
  }

  subtract(...vectors) {
    for (const vector of vectors) {
      vec4_subtract(this, vector);
    }
    this.check();
    return this;
  }

  multiply(...vectors) {
    for (const vector of vectors) {
      vec4_multiply(this, vector);
    }
    this.check();
    return this;
  }

  divide(...vectors) {
    for (const vector of vectors) {
      vec4_divide(this, vector);
    }
    this.check();
    return this;
  }

  scale(scale) {
    vec4_scale(this, this, scale);
    this.check();
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec4_scaleAndAdd(this, this, vector, scale);
    this.check();
    return this;
  }

  negate() {
    vec4_negate(this, this);
    this.check();
    return this;
  }

  inverse() {
    vec4_inverse(this, this);
    this.check();
    return this;
  }

  normalize() {
    vec4_normalize(this, this);
    this.check();
    return this;
  }

  dot(vector) {
    return vec4_dot(this, vector);
  }

  // cross(scale) {
  //   vec4_cross(this, this, scale);
  //   this.check();
  //   return this;
  // }

  lerp(vector, coeff) {
    vec4_lerp(this, this, vector, coeff);
    this.check();
    return this;
  }

  /*
  multiply(...vectors) {
    for (const vector of vectors) {
      vec4_multiply(this, vector);
    }
    this.check();
    return this;
  }

  divide(...vectors) {
    for (const vector of vectors) {
      vec4_divide(this, vector);
    }
    this.check();
    return this;
  }

  ceil() {
    vec4_ceil(this, this);
    this.check();
    return this;
  }

  floor() {
    vec4_floor(this, this);
    this.check();
    return this;
  }

  min() {
    vec4_min(this, this);
    this.check();
    return this;
  }

  max() {
    vec4_max(this, this);
    this.check();
    return this;
  }

  hermite(scale) {
    vec4_hermite(this, this, scale);
    this.check();
    return this;
  }

  bezier(scale) {
    vec4_bezier(this, this, scale);
    this.check();
    return this;
  }

  random(scale) {
    vec4_random(this, this, scale);
    this.check();
    return this;
  }

  rotateX(origin, angle) {
    vec4_rotateX(this, this, origin, angle);
    this.check();
    return this;
  }

  rotateY(origin, angle) {
    vec4_rotateY(this, this, origin, angle);
    this.check();
    return this;
  }

  rotateZ(origin, angle) {
    vec4_rotateZ(this, this, origin, angle);
    this.check();
    return this;
  }
  */
}
