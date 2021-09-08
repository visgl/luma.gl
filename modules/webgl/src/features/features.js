// Feature detection for WebGL
//
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

import WEBGL_FEATURES from './webgl-features-table';
import {isWebGL2, log} from '@luma.gl/gltools';
import {assert} from '../utils/assert';

const LOG_UNSUPPORTED_FEATURE = 2;

// Check one feature
export function hasFeature(gl, feature) {
  return hasFeatures(gl, feature);
}

// Check one or more features
export function hasFeatures(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every(feature => {
    return isFeatureSupported(gl, feature);
  });
}

// Return a list of supported features
export function getFeatures(gl) {
  gl.luma = gl.luma || {};
  gl.luma.caps = gl.luma.caps || {};
  for (const cap in WEBGL_FEATURES) {
    if (gl.luma.caps[cap] === undefined) {
      gl.luma.caps[cap] = isFeatureSupported(gl, cap);
    }
  }
  return gl.luma.caps;
}

// TODO - cache the value
function isFeatureSupported(gl, cap) {
  gl.luma = gl.luma || {};
  gl.luma.caps = gl.luma.caps || {};

  if (gl.luma.caps[cap] === undefined) {
    gl.luma.caps[cap] = queryFeature(gl, cap);
  }

  if (!gl.luma.caps[cap]) {
    log.log(LOG_UNSUPPORTED_FEATURE, `Feature: ${cap} not supported`)();
  }

  return gl.luma.caps[cap];
}

function queryFeature(gl, cap) {
  const feature = WEBGL_FEATURES[cap];
  assert(feature, cap);

  let isSupported;

  // Get extension name from table
  const featureDefinition = isWebGL2(gl) ? feature[1] || feature[0] : feature[0];

  // Check if the value is dependent on checking one or more extensions
  if (typeof featureDefinition === 'function') {
    isSupported = featureDefinition(gl);
  } else if (Array.isArray(featureDefinition)) {
    isSupported = true;
    for (const extension of featureDefinition) {
      isSupported = isSupported && Boolean(gl.getExtension(extension));
    }
  } else if (typeof featureDefinition === 'string') {
    isSupported = Boolean(gl.getExtension(featureDefinition));
  } else if (typeof featureDefinition === 'boolean') {
    isSupported = featureDefinition;
  } else {
    assert(false);
  }

  return isSupported;
}
