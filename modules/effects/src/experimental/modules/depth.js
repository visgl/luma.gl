// depth buffer utilities
// initial version ported from THREE.js

/* eslint-disable camelcase */
import pack from './pack';

const fs = `\
#define DEPTH_PACKING 3201

uniform bool depth_uEnabled;

#ifdef USE_LOGDEPTHBUF
uniform float logDepthBufFC;
#endif

#if DEPTH_PACKING == 3200
uniform float opacity;
#endif


// NOTE: viewZ/eyeZ is < 0 when in front of the camera per OpenGL conventions

float depth_viewZToOrthographicDepth(
  const in float viewZ, const in float near, const in float far
) {
  return ( viewZ + near ) / ( near - far );
}

float depth_orthographicDepthToViewZ(
  const in float linearClipZ, const in float near, const in float far
) {
  return linearClipZ * ( near - far ) - near;
}

float depth_viewZToPerspectiveDepth(
  const in float viewZ, const in float near, const in float far
) {
  return (( near + viewZ ) * far ) / (( far - near ) * viewZ );
}

float depth_perspectiveDepthToViewZ(
  const in float invClipZ, const in float near, const in float far
) {
  return ( near * far ) / ( ( far - near ) * invClipZ - far );
}

// Sample depth buffer and convert to float
float depth_getDepth(sampler2D tDepth, vec2 coord) {
  float depthValue = pack_RGBA8ToFloat(texture2D(tDepth, coord));
#ifdef USE_LOGDEPTHBUF
  float logz = depthValue;
  float w = pow(2.0, (logz / logDepthBufFC)) - 1.0;
  float z = (logz / w) + 1.0;
#else
  float z = depthValue;
#endif
  return z;
}

//
vec4 depth_getColor() {
#if DEPTH_PACKING == 3200
  return vec4( vec3( 1.0 - gl_FragCoord.z ), opacity );
#elif DEPTH_PACKING == 3201
  return pack_floatToRGBA8( gl_FragCoord.z );
#endif
}

vec4 depth_filterColor(vec4 color) {
  return depth_uEnabled ? depth_getColor() : color;
}
`;

const DEFAULT_PROPS = {
  depth_uEnabled: false
};

export default {
  name: 'depth',
  dependencies: [pack],
  fs,
  DEFAULT_PROPS,
  getUniforms: (props = DEFAULT_PROPS) => props
};
