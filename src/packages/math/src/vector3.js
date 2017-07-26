import MathArray from './math-array';
import {checkNumber} from './common';

// gl-matrix is too big. Cherry-pick individual imports from stack.gl version
/* eslint-disable camelcase */
import vec3_set from 'gl-vec3/set';
import vec3_length from 'gl-vec3/length';
import vec3_distance from 'gl-vec3/distance';
import vec3_angle from 'gl-vec3/angle';
import vec3_add from 'gl-vec3/add';
import vec3_subtract from 'gl-vec3/subtract';
import vec3_multiply from 'gl-vec3/multiply';
import vec3_divide from 'gl-vec3/divide';
import vec3_scale from 'gl-vec3/scale';
import vec3_scaleAndAdd from 'gl-vec3/scaleAndAdd';
import vec3_negate from 'gl-vec3/negate';
import vec3_inverse from 'gl-vec3/inverse';
import vec3_normalize from 'gl-vec3/normalize';
import vec3_dot from 'gl-vec3/dot';
import vec3_cross from 'gl-vec3/cross';
import vec3_lerp from 'gl-vec3/lerp';

export function validateVector3(v) {
  return v.length === 3 &&
    Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2]);
}

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

  // fromArray(array) {
  //   if (array instanceof Vector3) {
  //     return array;
  //   }
  //   return new Vector3(...array);
  // }

  set(x, y, z) {
    vec3_set(this, x, y, z);
    this.check();
    return this;
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

  length() {
    return vec3_length(this);
  }

  distance(vector) {
    return vec3_distance(this, vector);
  }

  angle(vector) {
    return vec3_angle(this, vector);
  }

  // MODIFIERS

  add(...vectors) {
    for (const vector of vectors) {
      vec3_add(this, vector);
    }
    this.check();
    return this;
  }

  subtract(...vectors) {
    for (const vector of vectors) {
      vec3_subtract(this, vector);
    }
    this.check();
    return this;
  }

  multiply(...vectors) {
    for (const vector of vectors) {
      vec3_multiply(this, vector);
    }
    this.check();
    return this;
  }

  divide(...vectors) {
    for (const vector of vectors) {
      vec3_divide(this, vector);
    }
    this.check();
    return this;
  }

  scale(scale) {
    if (Number.isFinite(scale)) {
      vec3_scale(this, this, scale);
    } else {
      vec3_dot(this, this, scale);
    }
    this.check();
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec3_scaleAndAdd(this, this, vector, scale);
    this.check();
    return this;
  }

  negate() {
    vec3_negate(this, this);
    this.check();
    return this;
  }

  inverse() {
    vec3_inverse(this, this);
    this.check();
    return this;
  }

  normalize() {
    vec3_normalize(this, this);
    this.check();
    return this;
  }

  dot(vector) {
    return vec3_dot(this, vector);
  }

  cross(vector) {
    vec3_cross(this, this, vector);
    this.check();
    return this;
  }

  lerp(vector, coeff) {
    vec3_lerp(this, this, vector, coeff);
    this.check();
    return this;
  }

  operation(operation, ...args) {
    operation(this, this, ...args);
    this.check();
    return this;
  }
}
