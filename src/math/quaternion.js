import {quat} from 'gl-matrix';

import {unary, binary, spread} from './utils/decorators';

import {validateQuaternion, checkQuaternion} from './utils/validators';

export default class Quaternion extends Array {
  // Creates a new identity quat
  constructor(i = 0, j = 0, k = 0, l = 1) {
    super();
    this[0] = i;
    this[1] = j;
    this[2] = k;
    this[3] = l;
    checkQuaternion(this);
  }

  // Creates a quaternion from the given 3x3 rotation matrix.
  // NOTE: The resultant quaternion is not normalized, so you should
  // be sure to renormalize the quaternion yourself where necessary.
  fromMatrix3(m) {
    quat.fromMat3(this, m);
    checkQuaternion(this);
    return this;
  }

  // Creates a new quat initialized with the given values
  fromValues(x, y, z, w) {
    return this.set(x, y, z, w);
  }

  // Creates a new quat initialized with values from an existing quaternion
  clone(a) {
    const clone = quat.copy(new Quaternion(), this);
    checkQuaternion(clone);
    return clone;
  }

  // Copy the values from one quat to another
  copy(a) {
    quat.copy(this, a);
    checkQuaternion(this);
    return this;
  }

  // Set a quat to the identity quaternion
  identity() {
    quat.identity(this);
    checkQuaternion(this);
    return this;
  }

  toString() {
    return quat.str(this);
  }

  toArray() {
    return this;
  }

  toFloat32Array() {
    return new Float32Array(this);
  }

  validate() {
    return validateQuaternion(this);
  }

  @binary
  equals(quaternion) {
    return quat.equals(this, quaternion);
  }

  // Returns whether or not the quaternions have exactly the same elements
  // in the same position (when compared with ===)
  @binary
  exactEquals(quaternion) {
    return quat.exactEquals(this, quaternion);
  }

  // Getters/setters
  get i() {
    return this[0];
  }

  set i(value) {
    this[0] = value;
    return this;
  }

  get j() {
    return this[1];
  }

  set j(value) {
    this[1] = value;
    return this;
  }

  get k() {
    return this[2];
  }

  set k(value) {
    this[2] = value;
    return this;
  }

  get l() {
    return this[3];
  }

  set l(value) {
    this[3] = value;
    return this;
  }

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
    checkQuaternion(this);
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
  @spread
  add(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.add only takes one argument');
    }
    quat.add(this, a);
    checkQuaternion(this);
    return this;
  }

  // Calculates the W component of a quat from the X, Y, and Z components.
  // Assumes that quaternion is 1 unit in length.
  // Any existing W component will be ignored.
  calculateW() {
    quat.calculateW(this, this);
    checkQuaternion(this);
    return this;
  }

  // Calculates the conjugate of a quat If the quaternion is normalized,
  // this function is faster than quat.inverse and produces the same result.
  conjugate() {
    quat.conjugate(this, this);
    checkQuaternion(this);
    return this;
  }

  // Calculates the inverse of a quat
  invert() {
    quat.invert(this, this);
    checkQuaternion(this);
    return this;
  }

  // Performs a linear interpolation between two quat's
  lerp(a, b, t) {
    quat.lerp(this, a, b, t);
    checkQuaternion(this);
    return this;
  }

  // Multiplies two quat's
  @spread
  multiply(a, b) {
    if (b !== undefined) {
      throw new Error('Quaternion.multiply only takes one argument');
    }
    quat.multiply(this, this, b);
    checkQuaternion(this);
    return this;
  }

  // Normalize a quat
  @unary
  normalize() {
    quat.normalize(this, this);
    checkQuaternion(this);
    return this;
  }

  // Rotates a quaternion by the given angle about the X axis
  rotateX(rad) {
    quat.rotateX(this, this, rad);
    checkQuaternion(this);
    return this;
  }

  // Rotates a quaternion by the given angle about the Y axis
  rotateY(rad) {
    quat.rotateY(this, this, rad);
    checkQuaternion(this);
    return this;
  }

  // Rotates a quaternion by the given angle about the Z axis
  rotateZ(rad) {
    quat.rotateZ(this, this, rad);
    checkQuaternion(this);
    return this;
  }

  // Scales a quat by a scalar number
  scale(b) {
    quat.scale(this, this, b);
    checkQuaternion(this);
    return this;
  }

  // Set the components of a quat to the given values
  set(i, j, k, l) {
    quat.set(this, i, j, k, l);
    checkQuaternion(this);
    return this;
  }

  // Sets a quat from the given angle and rotation axis, then returns it.
  setAxisAngle(axis, rad) {
    quat.setAxisAngle(this, axis, rad);
    checkQuaternion(this);
    return this;
  }

  // Performs a spherical linear interpolation between two quat
  slerp(a, b, t) {
    quat.slerp(this, a, b, t);
    checkQuaternion(this);
    return this;
  }
}
