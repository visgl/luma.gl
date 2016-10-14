import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import Vector2 from './vector2';
import Vector3 from './vector3';
import Vector4 from './vector4';

import {unary, binary, spread} from './utils/decorators';
import {validateMatrix4, checkMatrix4, checkVector2, checkVector3, checkVector4}
  from './utils/validators';

export default class Matrix4 extends Array {
  constructor(...args) {
    super();
    this.set(...args);
  }

  /* eslint-disable max-params */
  set(
    n11 = 1, n12 = 0, n13 = 0, n14 = 0,
    n21 = 0, n22 = 1, n23 = 0, n24 = 0,
    n31 = 0, n32 = 0, n33 = 1, n34 = 0,
    n41 = 0, n42 = 0, n43 = 0, n44 = 1
  ) {
    mat4.set(
      this,
      n11, n12, n13, n14,
      n21, n22, n23, n24,
      n31, n32, n33, n34,
      n41, n42, n43, n44
    );
    checkMatrix4(this);
    return this;
  }
  /* eslint-enable max-params */

  copy(mat) {
    mat4.copy(this, mat);
    checkMatrix4(this);
    return this;
  }

  @unary
  clone() {
    const clone = mat4.copy(new Matrix4(), this);
    checkMatrix4(clone);
    return clone;
  }

  @binary
  equals(a) {
    return mat4.equals(this, a);
  }

  @binary
  exactEquals(a) {
    return mat4.exactEquals(this, a);
  }

  @unary
  validate() {
    return validateMatrix4(this);
  }

  @unary
  determinant() {
    return mat4.determinant(this);
  }

  @unary
  toString() {
    return mat4.str(this);
  }

  @unary
  toArray() {
    return this;
  }

  @unary
  toFloat32Array() {
    return new Float32Array(this);
  }

  getRotation() {
  }

  // Constructors

  identity() {
    mat4.identity(this);
    checkMatrix4(this);
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
    checkMatrix4(this);
    return this;
  }

  // Generates a look-at matrix with the given eye position, focal point,
  // and up axis
  // eye vec3  Position of the viewer
  // center  vec3  Point the viewer is looking at
  // up  vec3  vec3 pointing up
  lookAt({eye, center, up}) {
    mat4.lookAt(this, eye, center, up);
    checkMatrix4(this);
    return this;
  }

  // Generates a orthogonal projection matrix with the given bounds
  // left  number  Left bound of the frustum
  // right number  Right bound of the frustum
  // bottom  number  Bottom bound of the frustum
  // top number  Top bound of the frustum
  // near  number  Near bound of the frustum
  // far number  Far bound of the frustum
  ortho({left, right, bottom, top, near, far}) {
    mat4.ortho(this, left, right, bottom, top, near, far);
    checkMatrix4(this);
    return this;
  }

  // Generates a perspective projection matrix with the given bounds
  // fovy  number  Vertical field of view in radians
  // aspect  number  Aspect ratio. typically viewport width/height
  // near  number  Near bound of the frustum
  // far number  Far bound of the frustum
  perspective({fov, aspect, near, far}) {
    mat4.perspective(this, fov, aspect, near, far);
    checkMatrix4(this);
    return this;
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
    checkMatrix4(this);
    return this;
  }

  // Calculates a 4x4 matrix from the given quaternion
  // q quat  Quaternion to create matrix from
  fromQuaternion(q) {
    mat4.fromQuat(this, q);
    checkMatrix4(this);
    return this;
  }

  fromQuat(q) {
    mat4.fromQuat(this, q);
    checkMatrix4(this);
    return this;
  }

  // Creates a matrix from a given angle around a given axis
  // his is equivalent to (but much faster than): mat4.identity(dest);
  // mat4.rotate(dest, dest, rad, axis);
  // rad Number  the angle to rotate the matrix by
  // axis  vec3  the axis to rotate around
  fromRotation(rad, axis) {
    mat4.fromRotation(this, rad, axis);
    checkMatrix4(this);
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
    checkMatrix4(this);
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
    checkMatrix4(this);
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
    checkMatrix4(this);
    return this;
  }

  // Creates a matrix from a vector scaling This is equivalent to
  // (but much faster than):
  // mat4.identity(dest); mat4.scale(dest, dest, vec);
  // v vec3  Scaling vector
  fromScaling(v) {
    mat4.fromScaling(this, v);
    checkMatrix4(this);
    return this;
  }

  // Creates a matrix from a vector translation
  // This is equivalent to (but much faster than):
  // mat4.identity(dest); mat4.translate(dest, dest, vec);
  // v vec3  Translation vector
  fromTranslation(v) {
    mat4.fromTranslation(this, v);
    checkMatrix4(this);
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
    checkMatrix4(this);
    return this;
  }

  // Creates a matrix from the given angle around the Y axis
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.rotateY(dest, dest, rad);
  // rad Number  the angle to rotate the matrix by
  fromYRotation(rad) {
    mat4.fromYRotation(this, rad);
    checkMatrix4(this);
    return this;
  }

  // Creates a matrix from the given angle around the Z axis
  // This is equivalent to (but much faster than):
  // mat4.identity(dest);
  // mat4.rotateZ(dest, dest, rad);
  // rad Number  the angle to rotate the matrix by
  fromZRotation(rad) {
    mat4.fromZRotation(this, rad);
    checkMatrix4(this);
    return this;
  }

  // Modifiers

  @unary
  transpose() {
    mat4.transpose(this, this);
    checkMatrix4(this);
    return this;
  }

  @unary
  invert() {
    mat4.invert(this, this);
    checkMatrix4(this);
    return this;
  }

  @unary
  adjoint() {
    mat4.adjoint(this, this);
    checkMatrix4(this);
    return this;
  }

  // Operations

  @spread
  add(a, b) {
    mat4.add(this, this, a);
    checkMatrix4(this);
    return this;
  }

  @spread
  multiply(a, b) {
    mat4.multiply(this, this, a);
    checkMatrix4(this);
    return this;
  }

  // Rotates a matrix by the given angle around the X axis
  // uses SIMD if available and enabled
  rotateX(radians) {
    mat4.rotateX(this, this, radians);
    checkMatrix4(this);
    return this;
  }

  // Rotates a matrix by the given angle around the Y axis.
  // Uses SIMD if available and enabled
  rotateY(radians) {
    mat4.rotateY(this, this, radians);
    checkMatrix4(this);
    return this;
  }

  // Rotates a matrix by the given angle around the Z axis.
  // Uses SIMD if available and enabled
  rotateZ(radians) {
    mat4.rotateZ(this, this, radians);
    checkMatrix4(this);
    return this;
  }

  @binary
  scale(vec) {
    mat4.scale(this, this, vec);
    checkMatrix4(this);
    return this;
  }

  @binary
  translate(vec) {
    mat4.translate(this, this, vec);
    checkMatrix4(this);
    return this;
  }

  transformVector2(vector, out = new Vector2()) {
    vec2.transformMat4(vector, out, this);
    checkVector2(out);
    return out;
  }

  transformVector3(vector, out = new Vector3()) {
    vec3.transformMat4(vector, out, this);
    checkVector3(out);
    return out;
  }

  transformVector4(vector, out = new Vector4()) {
    vec4.transformMat4(vector, out, this);
    checkVector4(out);
    return out;
  }

  // Transforms any 2, 3 or 4 element vector
  // returns a newly minted Vector2, Vector3 or Vector4
  transformVector(vector) {
    switch (vector.length) {
    case 2: return this.transformVector2(vector);
    case 3: return this.transformVector3(vector);
    case 4: return this.transformVector4(vector);
    default: throw new Error('Illegal vector');
    }
  }
}
