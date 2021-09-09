// Feature detection for WebGL
//
// Provides a function that enables simple checking of which WebGL features are
// available in an WebGL1 or WebGL2 environment.

import WEBGL_FEATURES from './webgl-features-table';
import {isWebGL2, log} from '@luma.gl/gltools';
import {assert} from '../utils';
import {getLumaContextData} from '../context/luma-context-data';

const LOG_UNSUPPORTED_FEATURE = 2;

// Check one feature
export function hasFeature(gl, feature) {
  return hasFeatures(gl, feature);
}

// Check one or more features
export function hasFeatures(gl, features) {
  features = Array.isArray(features) ? features : [features];
  return features.every((feature) => {
    return isFeatureSupported(gl, feature);
  });
}

// Return a list of supported features
export function getFeatures(gl) {
  const lumaContextData = getLumaContextData(gl);
  lumaContextData.caps = lumaContextData.caps || {};
  for (const cap in WEBGL_FEATURES) {
    if (lumaContextData.caps[cap] === undefined) {
      lumaContextData.caps[cap] = isFeatureSupported(gl, cap);
    }
  }
  return lumaContextData.caps;
}

// TODO - cache the value
function isFeatureSupported(gl, cap) {
  const lumaContextData = getLumaContextData(gl);
  lumaContextData.caps = lumaContextData.caps || {};

  if (lumaContextData.caps[cap] === undefined) {
    lumaContextData.caps[cap] = queryFeature(gl, cap);
  }

  if (!lumaContextData.caps[cap]) {
    log.log(LOG_UNSUPPORTED_FEATURE, `Feature: ${cap} not supported`)();
  }

  return lumaContextData.caps[cap];
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
