import MathArray from './math-array';
import {checkNumber} from './common';
import Vector2 from './vector2';
import Vector3 from './vector3';
import Vector4 from './vector4';
import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import {checkVector2, checkVector3, checkVector4} from './utils/validators';

export default class Matrix4 extends MathArray {
  constructor(...args) {
    super();
    if (Array.isArray(args[0]) && arguments.length === 1) {
      this.copy(args[0]);
    } else {
      this.identity();
    }
  }

  get ELEMENTS() {
    return 16;
  }

  /* eslint-disable max-params */
  setRowMajor(
    m00 = 1, m10 = 0, m20 = 0, m30 = 0,
    m01 = 0, m11 = 1, m21 = 0, m31 = 0,
    m02 = 0, m12 = 0, m22 = 1, m32 = 0,
    m03 = 0, m13 = 0, m23 = 0, m33 = 1
  ) {
    mat4.set(
      this,
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
    this.check();
    return this;
  }

  setColumnMajor(
    m00 = 1, m01 = 0, m02 = 0, m03 = 0,
    m10 = 0, m11 = 1, m12 = 0, m13 = 0,
    m20 = 0, m21 = 0, m22 = 1, m23 = 0,
    m30 = 0, m31 = 0, m32 = 0, m33 = 1
  ) {
    mat4.set(
      this,
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
    this.check();
    return this;
  }
  /* eslint-enable max-params */

  equals(a) {
    return mat4.equals(this, a);
  }

  exactEquals(a) {
    return mat4.exactEquals(this, a);
  }

  static equals(a, b) {
    return mat4.equals(a, b);
  }

  static exactEquals(a, b) {
    return mat4.exactEquals(a, b);
  }

  // toString() {
  //   if (glMatrix.printRowMajor) {
  //     mat4.str(this);
  //   } else {
  //     mat4.str(this);
  //   }
  // }

  // Row major setters and getters
  /* eslint-disable no-multi-spaces, brace-style, no-return-assign */
  get m00()      { return this[0]; }
  set m00(value) { return this[0] = checkNumber(value); }
  get m01()      { return this[4]; }
  set m01(value) { return this[4] = checkNumber(value); }
  get m02()      { return this[8]; }
  set m02(value) { return this[8] = checkNumber(value); }
  get m03()      { return this[12]; }
  set m03(value) { return this[12] = checkNumber(value); }
  get m10()      { return this[1]; }
  set m10(value) { return this[1] = checkNumber(value); }
  get m11()      { return this[5]; }
  set m11(value) { return this[5] = checkNumber(value); }
  get m12()      { return this[9]; }
  set m12(value) { return this[9] = checkNumber(value); }
  get m13()      { return this[13]; }
  set m13(value) { return this[13] = checkNumber(value); }
  get m20()      { return this[2]; }
  set m20(value) { return this[2] = checkNumber(value); }
  get m21()      { return this[6]; }
  set m21(value) { return this[6] = checkNumber(value); }
  get m22()      { return this[10]; }
  set m22(value) { return this[10] = checkNumber(value); }
  get m23()      { return this[14]; }
  set m23(value) { return this[14] = checkNumber(value); }
  get m30()      { return this[3]; }
  set m30(value) { return this[3] = checkNumber(value); }
  get m31()      { return this[7]; }
  set m31(value) { return this[7] = checkNumber(value); }
  get m32()      { return this[11]; }
  set m32(value) { return this[11] = checkNumber(value); }
  get m33()      { return this[15]; }
  set m33(value) { return this[15] = checkNumber(value); }
  /* eslint-enable no-multi-spaces, brace-style, no-return-assign */

  // Accessors

  determinant() {
    return mat4.determinant(this);
  }

  static determinant(m) {
    return mat4.determinant(m);
  }

  getRotation() {
    throw new Error('Not implemented');
  }

  // Constructors

  identity() {
    mat4.identity(this);
    this.check();
    return this;
  }

  // Generates a frustum matrix with the given bounds
  // left  Number  Left bound of the frustum
  // right Number  Right bound of the frustum
  // bottom  Number  Bottom bound of the frustum
  // top Number  Top bound of the frustum
  // near  Number  Near bound of the frustum
  // far Number  Far bound of the frustum
  frustum({left, right, bottom, top, near, far}) {
    mat4.frustum(this, left, right, bottom, top, near, far);
    this.check();
    return this;
  }

  static frustum(opts) {
    return new Matrix4().frustum(opts);
  }

  // Generates a look-at matrix with the given eye position, focal point,
  // and up axis
  // eye vec3  Position of the viewer
  // center  vec3  Point the viewer is looking at
  // up  vec3  vec3 pointing up
  lookAt({
    eye,
    center = [0, 0, 0],
    up = [0, 1, 0]
  } = {}) {
    mat4.lookAt(this, eye, center, up);
    this.check();
    return this;
  }

  static lookAt(opts) {
    return new Matrix4().lookAt(opts);
  }

  // Generates a orthogonal projection matrix with the given bounds
  // left  number  Left bound of the frustum
  // right number  Right bound of the frustum
  // bottom  number  Bottom bound of the frustum
  // top number  Top bound of the frustum
  // near  number  Near bound of the frustum
  // far number  Far bound of the frustum
  ortho({left, right, bottom, top, near = 0.1, far = 500}) {
    mat4.ortho(this, left, right, bottom, top, near, far);
    this.check();
    return this;
  }

  static ortho(opts) {
    return new Matrix4().ortho(opts);
  }

  // Generates a perspective projection matrix with the given bounds
  // fovy  number  Vertical field of view in radians
  // aspect  number  Aspect ratio. typically viewport width/height
  // near  number  Near bound of the frustum
  // far number  Far bound of the frustum
  perspective({
    fov = 45 * Math.PI / 180,
    aspect = 1,
    near = 0.1,
    far = 500
  } = {}) {
    if (fov > Math.PI * 2) {
      throw Error('radians');
    }
    mat4.perspective(this, fov, aspect, near, far);
    this.check();
    return this;
  }

  static perspective(opts) {
    return new Matrix4().perspective(opts);
  }

  // Generates a perspective projection matrix with the given field of view.
  // This is primarily useful for generating projection matrices to be used
  // with the still experiemental WebVR API.
  // fov Object  Object containing the following values:
  //   upDegrees, downDegrees, leftDegrees, rightDegrees
  // near  number  Near bound of the frustum
  // far number  Far bound of the frustum
  perspectiveFromFieldOfView(out, fov, near, far) {
    mat4.perspectiveFromFieldOfView(out, fov, near, far);
    this.check();
    return this;
  }

  static perspectiveFromFieldOfView(opts) {
    return new Matrix4().perspectiveFromFieldOfView(opts);
  }

  // Calculates a 4x4 matrix from the given quaternion
  // q quat  Quaternion to create matrix from
  fromQuaternion(q) {
    mat4.fromQuat(this, q);
    this.check();
    return this;
  }

  static fromQuaternion(q) {
    return new Matrix4().fromQuaternion(q);
  }

  // Creates a matrix from a given angle around a given axis
  // his is equivalent to (but much faster than): mat4.identity(dest);
  // mat4.rotate(dest, dest, rad, axis);
  // rad Number  the angle to rotate the matrix by
  // axis  vec3  the axis to rotate around
  fromRotation(rad, axis) {
    mat4.fromRotation(this, rad, axis);
    this.check();
    return this;
  }

  // Creates a matrix from a quaternion rotation and vector translation
  // This is equivalent to (but much faster than): mat4.identity(dest);
  // mat4.translate(dest, vec);
  // var quatMat = mat4.create();
  // quat4.toMat4(quat, quatMat);
  // mat4.multiply(dest, quatMat);
  // q quat4 Rotation quaternion
  // v vec3  Translation vector
  fromRotationTranslation(q, v) {
    mat4.fromRotationTranslation(this, q, v);
    this.check();
    return this;
  }

  // Creates a matrix from a quaternion rotation,
  // vector translation and vector scale
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.translate(dest, vec);
  // var quatMat = mat4.create();
  // quat4.toMat4(quat, quatMat);
  // mat4.multiply(dest, quatMat);
  // mat4.scale(dest, scale)
  // q quat4 Rotation quaternion
  // v vec3  Translation vector
  // s vec3  Scaling vector
  fromRotationTranslationScale(q, v, s) {
    mat4.fromRotationTranslationScale(this, q, v, s);
    this.check();
    return this;
  }

  // Creates a matrix from a quaternion rotation, vector translation and
  // vector scale, rotating and scaling around the given origin
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.translate(dest, vec);
  // mat4.translate(dest, origin);
  // var quatMat = mat4.create();
  // quat4.toMat4(quat, quatMat);
  // mat4.multiply(dest, quatMat);
  // mat4.scale(dest, scale)
  // mat4.translate(dest, negativeOrigin);
  // q quat4 Rotation quaternion
  // v vec3  Translation vector
  // s vec3  Scaling vector
  // o vec3  The origin vector around which to scale and rotate
  fromRotationTranslationScaleOrigin(q, v, s, o) {
    mat4.fromRotationTranslationScaleOrigin(this, q, v, s, o);
    this.check();
    return this;
  }

  // Creates a matrix from a vector scaling This is equivalent to
  // (but much faster than):
  // mat4.identity(dest); mat4.scale(dest, dest, vec);
  // v vec3  Scaling vector
  fromScaling(v) {
    mat4.fromScaling(this, v);
    this.check();
    return this;
  }

  // Creates a matrix from a vector translation
  // This is equivalent to (but much faster than):
  // mat4.identity(dest); mat4.translate(dest, dest, vec);
  // v vec3  Translation vector
  fromTranslation(v) {
    mat4.fromTranslation(this, v);
    this.check();
    return this;
  }

  // Create a new mat4 with the given values
  // m00 Number  Component in column 0, row 0 position (index 0)
  // m01 Number  Component in column 0, row 1 position (index 1)
  // m02 Number  Component in column 0, row 2 position (index 2)
  // m03 Number  Component in column 0, row 3 position (index 3)
  // m10 Number  Component in column 1, row 0 position (index 4)
  // m11 Number  Component in column 1, row 1 position (index 5)
  // m12 Number  Component in column 1, row 2 position (index 6)
  // m13 Number  Component in column 1, row 3 position (index 7)
  // m20 Number  Component in column 2, row 0 position (index 8)
  // m21 Number  Component in column 2, row 1 position (index 9)
  // m22 Number  Component in column 2, row 2 position (index 10)
  // m23 Number  Component in column 2, row 3 position (index 11)
  // m30 Number  Component in column 3, row 0 position (index 12)
  // m31 Number  Component in column 3, row 1 position (index 13)
  // m32 Number  Component in column 3, row 2 position (index 14)
  // m33 Number  Component in column 3, row 3 position (index 15)
  // fromValues(m00, m01, m02, m03, m10, m11, m12, m13,
  //   m20, m21, m22, m23, m30, m31, m32, m33) {mat4}

  // Creates a matrix from the given angle around the X axis
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.rotateX(dest, dest, rad);
  // rad Number  the angle to rotate the matrix by
  fromXRotation(rad) {
    mat4.fromXRotation(this, rad);
    this.check();
    return this;
  }

  // Creates a matrix from the given angle around the Y axis
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.rotateY(dest, dest, rad);
  // rad Number  the angle to rotate the matrix by
  fromYRotation(rad) {
    mat4.fromYRotation(this, rad);
    this.check();
    return this;
  }

  // Creates a matrix from the given angle around the Z axis
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.rotateZ(dest, dest, rad);
  // rad Number  the angle to rotate the matrix by
  fromZRotation(rad) {
    mat4.fromZRotation(this, rad);
    this.check();
    return this;
  }

  // Modifiers

  transpose() {
    mat4.transpose(this, this);
    this.check();
    return this;
  }

  invert() {
    mat4.invert(this, this);
    this.check();
    return this;
  }

  adjoint() {
    mat4.adjoint(this, this);
    this.check();
    return this;
  }

  // Operations

  add(a, b) {
    mat4.add(this, this, a);
    this.check();
    return this;
  }

  multiplyLeft(a) {
    mat4.multiply(this, a, this);
    this.check();
    return this;
  }

  multiplyRight(a) {
    mat4.multiply(this, this, a);
    this.check();
    return this;
  }

  // Rotates a matrix by the given angle around the X axis
  // uses SIMD if available and enabled
  rotateX(radians) {
    mat4.rotateX(this, this, radians);
    this.check();
    return this;
  }

  // Rotates a matrix by the given angle around the Y axis.
  // Uses SIMD if available and enabled
  rotateY(radians) {
    mat4.rotateY(this, this, radians);
    this.check();
    return this;
  }

  // Rotates a matrix by the given angle around the Z axis.
  // Uses SIMD if available and enabled
  rotateZ(radians) {
    mat4.rotateZ(this, this, radians);
    this.check();
    return this;
  }

  // TODO - may not be needed
  /* eslint-disable max-statements */
  rotateXYZ([rx, ry, rz]) {
    return this.rotateX(rx).rotateY(ry).rotateZ(rz);
  }
  /* eslint-enable max-statements */

  rotateAxis(theta, axis) {
    mat4.rotate(this, this, theta, axis);
    this.check();
    return this;
  }

  scale(vec) {
    mat4.scale(this, this, vec);
    this.check();
    return this;
  }

  translate(vec) {
    mat4.translate(this, this, vec);
    this.check();
    return this;
  }

  transformVector2(vector, out) {
    out = out || new Vector2();
    vec2.transformMat4(out, vector, this);
    checkVector2(out);
    return out;
  }

  transformVector3(vector, out = new Vector3()) {
    out = out || new Vector3();
    vec3.transformMat4(out, vector, this);
    checkVector3(out);
    return out;
  }

  transformVector4(vector, out = new Vector4()) {
    out = out || new Vector4();
    vec4.transformMat4(out, vector, this);
    checkVector4(out);
    return out;
  }

  // Transforms any 2, 3 or 4 element vector
  // returns a newly minted Vector2, Vector3 or Vector4
  transformVector(vector, out) {
    switch (vector.length) {
    case 2: return this.transformVector2(vector, out);
    case 3: return this.transformVector3(vector, out);
    case 4: return this.transformVector4(vector, out);
    default: throw new Error('Illegal vector');
    }
  }
}
