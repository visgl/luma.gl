import MathArray from './math-array';
import {checkNumber} from './common';

// gl-matrix is too big. Cherry-pick individual imports from stack.gl version
/* eslint-disable camelcase */
import vec2_set from 'gl-vec2/set';
import vec2_add from 'gl-vec2/add';
import vec2_subtract from 'gl-vec2/subtract';
import vec2_multiply from 'gl-vec2/multiply';
import vec2_divide from 'gl-vec2/divide';
import vec2_scale from 'gl-vec2/scale';
import vec2_scaleAndAdd from 'gl-vec2/scaleAndAdd';
import vec2_negate from 'gl-vec2/negate';
import vec2_normalize from 'gl-vec2/normalize';
import vec2_dot from 'gl-vec2/dot';
import vec2_cross from 'gl-vec2/cross';
import vec2_lerp from 'gl-vec2/lerp';

export function validateVector2(v) {
  return v.length === 2 &&
    Number.isFinite(v[0]) && Number.isFinite(v[1]);
}

export default class Vector2 extends MathArray {
  // Creates a new, empty vec2
  constructor(x = 0, y = 0) {
    super();
    if (Array.isArray(x) && arguments.length === 1) {
      this.copy(x);
    } else {
      this.set(x, y);
    }
  }

  set(x, y) {
    vec2_set(this, x, y);
    this.check();
    return this;
  }

  // Getters/setters
  /* eslint-disable no-multi-spaces, brace-style, no-return-assign */
  get ELEMENTS() { return 2; }
  get x()      { return this[0]; }
  set x(value) { return this[0] = checkNumber(value); }
  get y()      { return this[1]; }
  set y(value) { return this[1] = checkNumber(value); }
  /* eslint-disable no-multi-spaces, brace-style, no-return-assign */

  add(...vectors) {
    for (const vector of vectors) {
      vec2_add(this, vector);
    }
    return this;
  }

  subtract(...vectors) {
    for (const vector of vectors) {
      vec2_subtract(this, vector);
    }
    this.check();
    return this;
  }

  multiply(...vectors) {
    for (const vector of vectors) {
      vec2_multiply(this, vector);
    }
    this.check();
    return this;
  }

  divide(...vectors) {
    for (const vector of vectors) {
      vec2_divide(this, vector);
    }
    this.check();
    return this;
  }

  scale(scale) {
    if (Number.isFinite(scale)) {
      vec2_scale(this, this, scale);
    }
    this.check();
    return this;
  }

  scaleAndAdd(vector, scale) {
    vec2_scaleAndAdd(this, this, vector, scale);
    this.check();
    return this;
  }

  negate() {
    vec2_negate(this, this);
    this.check();
    return this;
  }

  normalize() {
    vec2_normalize(this, this);
    this.check();
    return this;
  }

  dot(vector) {
    return vec2_dot(this, vector);
  }

  cross(vector) {
    vec2_cross(this, this, vector);
    this.check();
    return this;
  }

  lerp(vector, coeff) {
    vec2_lerp(this, this, vector, coeff);
    this.check();
    return this;
  }

  operation(operation, ...args) {
    operation(this, this, ...args);
    this.check();
    return this;
  }
}
