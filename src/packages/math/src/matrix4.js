import MathArray from './math-array';
import {checkNumber} from './common';
import Vector2, {validateVector2} from './vector2';
import Vector3, {validateVector3} from './vector3';
import Vector4, {validateVector4} from './vector4';
import assert from 'assert';

// gl-matrix is too big. Cherry-pick individual imports from stack.gl version
/* eslint-disable camelcase */
import mat4_determinant from 'gl-mat4/determinant';
import mat4_fromQuat from 'gl-mat4/fromQuat';
import mat4_frustum from 'gl-mat4/frustum';
import mat4_lookAt from 'gl-mat4/lookAt';
import mat4_ortho from 'gl-mat4/ortho';
import mat4_perspective from 'gl-mat4/perspective';
import mat4_transpose from 'gl-mat4/transpose';
import mat4_invert from 'gl-mat4/invert';
import mat4_multiply from 'gl-mat4/multiply';
import mat4_rotateX from 'gl-mat4/rotateX';
import mat4_rotateY from 'gl-mat4/rotateY';
import mat4_rotateZ from 'gl-mat4/rotateZ';
import mat4_rotate from 'gl-mat4/rotateZ';
import mat4_scale from 'gl-mat4/scale';
import mat4_translate from 'gl-mat4/translate';
import vec2_transformMat4 from 'gl-vec2/transformMat4';
import vec3_transformMat4 from 'gl-vec3/transformMat4';
import vec4_transformMat4 from 'gl-vec4/transformMat4';

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function validateMatrix4(m) {
  return m.length === 16 &&
    Number.isFinite(m[0]) && Number.isFinite(m[1]) &&
    Number.isFinite(m[2]) && Number.isFinite(m[3]) &&
    Number.isFinite(m[4]) && Number.isFinite(m[5]) &&
    Number.isFinite(m[6]) && Number.isFinite(m[7]) &&
    Number.isFinite(m[8]) && Number.isFinite(m[9]) &&
    Number.isFinite(m[10]) && Number.isFinite(m[11]) &&
    Number.isFinite(m[12]) && Number.isFinite(m[13]) &&
    Number.isFinite(m[14]) && Number.isFinite(m[15]);
}

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
    return this.set(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  setColumnMajor(
    m00 = 1, m01 = 0, m02 = 0, m03 = 0,
    m10 = 0, m11 = 1, m12 = 0, m13 = 0,
    m20 = 0, m21 = 0, m22 = 1, m23 = 0,
    m30 = 0, m31 = 0, m32 = 0, m33 = 1
  ) {
    return this.set(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  set(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    this[0] = m00;
    this[1] = m01;
    this[2] = m02;
    this[3] = m03;
    this[4] = m10;
    this[5] = m11;
    this[6] = m12;
    this[7] = m13;
    this[8] = m20;
    this[9] = m21;
    this[10] = m22;
    this[11] = m23;
    this[12] = m30;
    this[13] = m31;
    this[14] = m32;
    this[15] = m33;
    this.check();
    return this;
  }
  /* eslint-enable max-params */

  // toString() {
  //   if (config.printRowMajor) {
  //     mat4_str(this);
  //   } else {
  //     mat4_str(this);
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
    return mat4_determinant(this);
  }

  // Constructors

  identity() {
    for (let i = 0; i < IDENTITY.length; ++i) {
      this[i] = IDENTITY[i];
    }
    this.check();
    return this;
  }

  // Calculates a 4x4 matrix from the given quaternion
  // q quat  Quaternion to create matrix from
  fromQuaternion(q) {
    mat4_fromQuat(this, q);
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
    mat4_frustum(this, left, right, bottom, top, near, far);
    this.check();
    return this;
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
    mat4_lookAt(this, eye, center, up);
    this.check();
    return this;
  }

  // Generates a orthogonal projection matrix with the given bounds
  // left  number  Left bound of the frustum
  // right number  Right bound of the frustum
  // bottom  number  Bottom bound of the frustum
  // top number  Top bound of the frustum
  // near  number  Near bound of the frustum
  // far number  Far bound of the frustum
  ortho({left, right, bottom, top, near = 0.1, far = 500}) {
    mat4_ortho(this, left, right, bottom, top, near, far);
    this.check();
    return this;
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
    mat4_perspective(this, fov, aspect, near, far);
    this.check();
    return this;
  }

  // Modifiers

  transpose() {
    mat4_transpose(this, this);
    this.check();
    return this;
  }

  invert() {
    mat4_invert(this, this);
    this.check();
    return this;
  }

  // Operations

  multiplyLeft(a) {
    mat4_multiply(this, a, this);
    this.check();
    return this;
  }

  multiplyRight(a) {
    mat4_multiply(this, this, a);
    this.check();
    return this;
  }

  // Rotates a matrix by the given angle around the X axis
  rotateX(radians) {
    mat4_rotateX(this, this, radians);
    this.check();
    return this;
  }

  // Rotates a matrix by the given angle around the Y axis.
  rotateY(radians) {
    mat4_rotateY(this, this, radians);
    this.check();
    return this;
  }

  // Rotates a matrix by the given angle around the Z axis.
  rotateZ(radians) {
    mat4_rotateZ(this, this, radians);
    this.check();
    return this;
  }

  rotateXYZ([rx, ry, rz]) {
    return this.rotateX(rx).rotateY(ry).rotateZ(rz);
  }

  rotateAxis(radians, axis) {
    mat4_rotate(this, this, radians, axis);
    this.check();
    return this;
  }

  scale(vec) {
    mat4_scale(this, this, vec);
    this.check();
    return this;
  }

  translate(vec) {
    mat4_translate(this, this, vec);
    this.check();
    return this;
  }

  transformVector2(vector, out) {
    out = out || new Vector2();
    vec2_transformMat4(out, vector, this);
    assert(validateVector2(out));
    return out;
  }

  transformVector3(vector, out = new Vector3()) {
    out = out || new Vector3();
    vec3_transformMat4(out, vector, this);
    assert(validateVector3(out));
    return out;
  }

  transformVector4(vector, out = new Vector4()) {
    out = out || new Vector4();
    vec4_transformMat4(out, vector, this);
    assert(validateVector4(out));
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
