import MathArray from './math-array';
import {checkNumber} from './common';

// gl-matrix is a big library. Cherry-pick individual imports from stack.gl version
// import {vec2} from 'gl-matrix';
/* eslint-disable camelcase */
import vec2_set from 'gl-vec2/set';
import vec2_add from 'gl-vec2/add';

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
}
