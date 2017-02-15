import MathArray from './math-array';
import {checkNumber} from './common';
import {quat} from 'gl-matrix';

export default class Quaternion extends MathArray {
  // Creates a new identity quat
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super();
    if (Array.isArray(x) && arguments.length === 1) {
      this.copy(x);
    } else {
      this.set(x, y, z, w);
    }
  }

  // Creates a quaternion from the given 3x3 rotation matrix.
  // NOTE: The resultant quaternion is not normalized, so you should
  // be sure to renormalize the quaternion yourself where necessary.
  fromMatrix3(m) {
    quat.fromMat3(this, m);
    this.check();
    return this;
  }

  // Creates a new quat initialized with the given values
  fromValues(x, y, z, w) {
    return this.set(x, y, z, w);
  }

  // Set a quat to the identity quaternion
  identity() {
    quat.identity(this);
    this.check();
    return this;
  }

  equals(quaternion) {
    return quat.equals(this, quaternion);
  }

  // Returns whether or not the quaternions have exactly the same elements
  // in the same position (when compared with ===)
  exactEquals(quaternion) {
    return quat.exactEquals(this, quaternion);
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

  // Calculates the length of a quat
  length() {
    return quat.length(this);
  }

  // Calculates the squared length of a quat
  squaredLength(a) {
    return quat.squaredLength(this);
  }

  // Calculates the dot product of two quat's
  // @return {Number}
  dot(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.dot only takes one argument');
    }
    return quat.dot(this, a);
  }

  // Gets the rotation axis and angle for a given quaternion.
  // If a quaternion is created with setAxisAngle, this method will
  // return the same values as providied in the original parameter
  // list OR functionally equivalent values.
  // Example: The quaternion formed by axis [0, 0, 1] and angle -90
  // is the same as the quaternion formed by [0, 0, 1] and 270.
  // This method favors the latter.
  // @return {{[x,y,z], Number}}
  getAxisAngle() {
    const axis = [];
    const angle = quat.getAxisAngle(axis, this);
    return {axis, angle};
  }

  // MODIFIERS

  // Sets a quaternion to represent the shortest rotation from one vector
  // to another. Both vectors are assumed to be unit length.
  rotationTo(vectorA, vectorB) {
    quat.rotationTo(this, vectorA, vectorB);
    this.check();
    return this;
  }

  // Sets the specified quaternion with values corresponding to the given axes.
  // Each axis is a vec3 and is expected to be unit length and perpendicular
  // to all other specified axes.
  // setAxes() {
  //   Number
  // }

  // Performs a spherical linear interpolation with two control points
  // sqlerp() {
  //   Number;
  // }

  // Adds two quat's
  add(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.add only takes one argument');
    }
    quat.add(this, a);
    this.check();
    return this;
  }

  // Calculates the W component of a quat from the X, Y, and Z components.
  // Any existing W component will be ignored.
  calculateW() {
    quat.calculateW(this, this);
    this.check();
    return this;
  }

  // Calculates the conjugate of a quat If the quaternion is normalized,
  // this function is faster than quat.inverse and produces the same result.
  conjugate() {
    quat.conjugate(this, this);
    this.check();
    return this;
  }

  // Calculates the inverse of a quat
  invert() {
    quat.invert(this, this);
    this.check();
    return this;
  }

  // Performs a linear interpolation between two quat's
  lerp(a, b, t) {
    quat.lerp(this, a, b, t);
    this.check();
    return this;
  }

  // Multiplies two quat's
  multiply(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.multiply only takes one argument');
    }
    quat.multiply(this, this, b);
    this.check();
    return this;
  }

  // Normalize a quat
  normalize() {
    quat.normalize(this, this);
    this.check();
    return this;
  }

  // Rotates a quaternion by the given angle about the X axis
  rotateX(rad) {
    quat.rotateX(this, this, rad);
    this.check();
    return this;
  }

  // Rotates a quaternion by the given angle about the Y axis
  rotateY(rad) {
    quat.rotateY(this, this, rad);
    this.check();
    return this;
  }

  // Rotates a quaternion by the given angle about the Z axis
  rotateZ(rad) {
    quat.rotateZ(this, this, rad);
    this.check();
    return this;
  }

  // Scales a quat by a scalar number
  scale(b) {
    quat.scale(this, this, b);
    this.check();
    return this;
  }

  // Set the components of a quat to the given values
  set(i, j, k, l) {
    quat.set(this, i, j, k, l);
    this.check();
    return this;
  }

  // Sets a quat from the given angle and rotation axis, then returns it.
  setAxisAngle(axis, rad) {
    quat.setAxisAngle(this, axis, rad);
    this.check();
    return this;
  }

  // Performs a spherical linear interpolation between two quat
  slerp(a, b, t) {
    quat.slerp(this, a, b, t);
    this.check();
    return this;
  }
}
