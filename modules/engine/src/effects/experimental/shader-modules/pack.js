// Packing of floats into RGBA8
/* eslint-disable camelcase */

const fs = `\
const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );

const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

const float ShiftRight8 = 1. / 256.;

vec4 pack_floatToRGBA8( const in float v ) {
  vec4 r = vec4( fract( v * PackFactors ), v );
  r.yzw -= r.xyz * ShiftRight8; // tidy overflow
  return r * PackUpscale;
}

float pack_RGBA8ToFloat( const in vec4 v ) {
  return dot(v, UnpackFactors);
}
`;

const DEFAULT_PROPS = {};

export default {
  name: 'pack',
  fs,
  vs: fs,
  DEFAULT_PROPS,
  getUniforms: props => props
};
