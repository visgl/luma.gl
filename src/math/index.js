export * from './common';
export {default as Vector2} from './vector2';
export {default as Vector3} from './vector3';
export {default as Vector4} from './vector4';
export {default as Matrix4} from './matrix4';
export {default as Quaternion} from './quaternion';
export {default as Euler} from './euler';

// FOR TAPE TESTING
// Use tape assert to compares using a.equals(b)
// Usage test(..., t => { tapeEquals(t, a, b, ...); });
export function tapeEquals(t, a, b, msg, extra) {
  /* eslint-disable no-invalid-this */
  t._assert(a.equals(b), {
    message: msg || 'should be equal',
    operator: 'equal',
    actual: a,
    expected: b,
    extra
  });
}
