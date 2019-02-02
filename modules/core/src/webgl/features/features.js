// Feature detection for WebGL
//
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

import WEBGL_FEATURES from './webgl-features-table';
import {isWebGL2} from '../utils';
import {assert} from '../../utils';

// Create a key-mirrored FEATURES array
// TODO - refactor, this has tree-shaking side effects
const FEATURES = {};
Object.keys(WEBGL_FEATURES).forEach(key => {
  FEATURES[key] = key;
});
export {FEATURES};

// TODO - cache the value
function getFeature(gl, cap) {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  // Get extension name from table
  const extensionName = isWebGL2(gl) ? feature[1] || feature[0] : feature[0];

  // Check if the value is dependent on checking an extension
  const value =
    typeof extensionName === 'string' ? Boolean(gl.getExtension(extensionName)) : extensionName;

  assert(value === false || value === true);

  return value;
}

// capability can be a WebGL extension name or a luma capability name
export function hasFeature(gl, feature) {
  return hasFeatures(gl, feature);
}

export function hasFeatures(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every(feature => {
    return getFeature(gl, feature);
  });
}

export function getFeatures(gl) {
  gl.luma = gl.luma || {};

  if (!gl.luma.caps) {
    gl.luma.caps = {};
    gl.luma.caps.webgl2 = isWebGL2(gl);
    for (const cap in WEBGL_FEATURES) {
      gl.luma.caps[cap] = getFeature(gl, cap);
    }
  }
  return gl.luma.caps;
}

export const TEST_EXPORTS = {
  WEBGL_FEATURES
};
