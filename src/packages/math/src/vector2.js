import MathArray from './math-array';
import {checkNumber} from './common';
import {vec2} from 'gl-matrix';

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
    vec2.set(this, x, y);
    this.check();
    return this;
  }

  equals(vector) {
    return vec2.equals(this, vector);
  }

  exactEquals(vector) {
    return vec2.exactEquals(this, vector);
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
      vec2.add(this, vector);
    }
    return this;
  }
}
