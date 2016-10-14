import {glMatrix} from 'gl-matrix';

// TODO - remove
glMatrix.debug = true;

export {glMatrix};

export function radians(fromDegrees) {
  return fromDegrees * Math.PI / 180;
}

export function degrees(fromRadians) {
  return fromRadians * 180 / Math.PI;
}

export function equals(a, b) {
  return Math.abs(a - b) <=
    glMatrix.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}

export function configure(options) {
  if ('epsilon' in options) {
    glMatrix.EPSILON = options.epsilon;
  }

  if ('debug' in options) {
    glMatrix.debug = options.debug;
  }
}
