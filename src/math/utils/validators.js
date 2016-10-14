import {glMatrix} from 'gl-matrix';

export function checkArguments(...args) {
  for (let i = 0; i < args.length; ++i) {
    if (args[i] === undefined) {
      throw new Error('Invalid math argument');
    }
  }
}

export function validateVector2(v) {
  return v.length === 2 &&
    Number.isFinite(v[0]) && Number.isFinite(v[1]);
}

export function checkVector2(v) {
  if (glMatrix.debug && !validateVector2(v)) {
    throw new Error('Invalid Vector2');
  }
}

export function validateVector3(v) {
  return v.length === 3 &&
    Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2]);
}

export function checkVector3(v) {
  if (glMatrix.debug && !validateVector3(v)) {
    throw new Error('Invalid Vector3');
  }
}

export function validateVector4(v) {
  return v.length === 4 &&
    Number.isFinite(v[0]) && Number.isFinite(v[1]) &&
    Number.isFinite(v[2]) && Number.isFinite(v[3]);
}

export function checkVector4(v) {
  if (glMatrix.debug && !validateVector4(v)) {
    throw new Error('Invalid Vector4');
  }
}

export function validateQuaternion(q) {
  return q.length === 4 &&
    Number.isFinite(q[0]) && Number.isFinite(q[1]) &&
    Number.isFinite(q[2]) && Number.isFinite(q[3]);
}

export function checkQuaternion(q) {
  if (glMatrix.debug && !validateQuaternion(q)) {
    throw new Error('Invalid Quaternion');
  }
}

export function validateMatrix2(m) {
  return m.length === 4 &&
    Number.isFinite(m[0]) && Number.isFinite(m[1]) &&
    Number.isFinite(m[2]) && Number.isFinite(m[3]);
}

export function checkMatrix2(m) {
  if (glMatrix.debug && !validateMatrix2(m)) {
    throw new Error('Invalid Matrix2');
  }
}

export function validateMatrix2d(m) {
  return m.length === 6 &&
    Number.isFinite(m[0]) && Number.isFinite(m[1]) &&
    Number.isFinite(m[2]) && Number.isFinite(m[3]) &&
    Number.isFinite(m[4]) && Number.isFinite(m[5]);
}

export function checkMatrix2d(m) {
  if (glMatrix.debug && !validateMatrix2d(m)) {
    throw new Error('Invalid Matrix2d');
  }
}

export function validateMatrix3(m) {
  return m.length === 9 &&
    Number.isFinite(m[0]) && Number.isFinite(m[1]) &&
    Number.isFinite(m[2]) && Number.isFinite(m[3]) &&
    Number.isFinite(m[4]) && Number.isFinite(m[5]) &&
    Number.isFinite(m[6]) && Number.isFinite(m[7]) &&
    Number.isFinite(m[8]);
}

export function checkMatrix3(m) {
  if (glMatrix.debug && !validateMatrix3(m)) {
    throw new Error('Invalid Matrix3');
  }
}

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

export function checkMatrix4(m) {
  if (glMatrix.debug && !validateMatrix4(m)) {
    throw new Error('Invalid Matrix4');
  }
}
