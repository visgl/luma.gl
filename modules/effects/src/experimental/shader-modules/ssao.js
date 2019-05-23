/**
 * Screen-space ambient occlusion shader
 *
 * Ported to luma.gl from THREE.js
 *
 * Attributions: (per comments in original THREE.js files)
 * - ported to THREE.js from SSAO GLSL shader v1.2 by alteredq / http://alteredqualia.com/
 *   assembled by Martins Upitis (martinsh) (http://devlog-martinsh.blogspot.com)
 * - original technique by ArKano22 http://www.gamedev.net/topic/550699-ssao-no-halo-artifacts/
 * - modifications
 * - modified to use RGBA packed depth texture (use clear color 1,1,1,1 for depth pass)
 * - refactoring and optimizations
 */

/* eslint-disable camelcase */
import depth from './depth';

const DEFAULT_PROPS = {
  ssao_uEnabled: true,
  tDiffuse: null,
  tDepth: null,
  size: [512, 512],
  cameraNear: 1,
  cameraFar: 100,
  radius: 32, // 4
  onlyAO: false,
  aoClamp: 0.25,
  lumInfluence: 0.7
};

const fsSSAO = `\
// Inputs
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 size;        // texture width, height

// TODO - move to 'camera' module?
uniform float cameraNear;
uniform float cameraFar;

// SSAO
uniform bool ssao_uEnabled;
uniform float radius;     // ao radius
uniform float aoClamp;    // depth clamp - reduces haloing at screen edges
uniform float lumInfluence;  // how much luminance affects occlusion

uniform bool onlyAO;      // use only ambient occlusion pass?

#define DL 2.399963229728653  // PI * ( 3.0 - sqrt( 5.0 ) )
#define EULER 2.718281828459045

const int samples = 64;           // ao sample count
const bool useNoise = true;       // use noise instead of pattern for sample dithering
const float noiseAmount = 0.0004; // dithering amount
const float diffArea = 0.4;       // self-shadowing reduction
const float gDisplace = 0.4;      // gauss bell center

// Random noise generating: pattern texture for dithering
vec2 rand( const vec2 coord ) {
  vec2 noise;

  if ( useNoise ) {
    float nx = dot ( coord, vec2( 12.9898, 78.233 ) );
    float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );
    noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );
  } else {
    float ff = fract( 1.0 - coord.s * ( size.x / 2.0 ) );
    float gg = fract( coord.t * ( size.y / 2.0 ) );
    noise = vec2( 0.25, 0.75 ) * vec2( ff ) + vec2( 0.75, 0.25 ) * gg;
  }

  return ( noise * 2.0  - 1.0 ) * noiseAmount;
}

// RGBA depth

float readDepth( const in vec2 coord ) {
  float z = depth_getDepth(tDepth, coord);

  float cameraFarPlusNear = cameraFar + cameraNear;
  float cameraFarMinusNear = cameraFar - cameraNear;
  float cameraCoef = 2.0 * cameraNear;
  return cameraCoef / ( cameraFarPlusNear - z * cameraFarMinusNear );
}

float compareDepths( const in float depth1, const in float depth2, inout int far ) {
  float garea = 8.0;                         // gauss bell width
  float diff = ( depth1 - depth2 ) * 100.0;  // depth difference (0-100)

  // reduce left bell width to avoid self-shadowing

  if ( diff < gDisplace ) {
    garea = diffArea;
  } else {
    far = 1;
  }

  float dd = diff - gDisplace;
  float gauss = pow( EULER, -2.0 * ( dd * dd ) / ( garea * garea ) );
  return gauss;
}

float calcAO( float depth, float dw, float dh, vec2 uv ) {
  vec2 vv = vec2( dw, dh );

  vec2 coord1 = uv + radius * vv;
  vec2 coord2 = uv - radius * vv;

  float temp1 = 0.0;
  float temp2 = 0.0;

  int far = 0;
  temp1 = compareDepths( depth, readDepth( coord1 ), far );

  // DEPTH EXTRAPOLATION
  if ( far > 0 ) {
    temp2 = compareDepths( readDepth( coord2 ), depth, far );
    temp1 += ( 1.0 - temp1 ) * temp2;
  }

  return temp1;
}

vec4 ssao_filterColor(vec4 color4, vec2 uv) {

  vec2 noise = rand( uv );
  float depth = readDepth( uv );

  float tt = clamp( depth, aoClamp, 1.0 );

  float w = ( 1.0 / size.x ) / tt + ( noise.x * ( 1.0 - noise.x ) );
  float h = ( 1.0 / size.y ) / tt + ( noise.y * ( 1.0 - noise.y ) );

  float ao = 0.0;

  float dz = 1.0 / float( samples );
  float l = 0.0;
  float z = 1.0 - dz / 2.0;

  for ( int i = 0; i <= samples; i ++ ) {
    float r = sqrt( 1.0 - z );

    float pw = cos( l ) * r;
    float ph = sin( l ) * r;
    ao += calcAO( depth, pw * w, ph * h, uv );
    z = z - dz;
    l = l + DL;
  }

  ao /= float( samples );
  ao = 1.0 - ao;

  vec3 color = color4.rgb;

  vec3 final = color;

  vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
  float lum = dot( color.rgb, lumcoeff );
  vec3 luminance = vec3( lum );

  // mix( color * ao, white, luminance )
  final = vec3( color * mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );

  if ( onlyAO ) {
    // ambient occlusion only
    final = vec3( mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );
  }

  return vec4( final, 1.0 );
}

vec4 ssao_getColor(vec2 uv) {
  vec4 color = texture2D( tDiffuse, uv );
  return ssao_uEnabled ? ssao_filterColor(color, uv) : color;
}
`;

export default {
  name: 'ssao',
  dependencies: [depth],
  DEFAULT_PROPS,
  fs: fsSSAO
};
