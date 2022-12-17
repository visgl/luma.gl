// luma.gl, MIT license

import {glsl} from '../../../lib/glsl-utils/highlight';

export const pbrMaterialUniforms = glsl`\
uniform Projection {
  // Projection
  uniform vec3 u_Camera;
};

uniform PBRMaterial {
  // Material is unlit
  uniform bool unlit;

  // Base color map
  uniform bool baseColorMapEnabled;
  uniform vec4 baseColorFactor;

  uniform bool normalMapEnabled;  
  uniform float normalScale; // #ifdef HAS_NORMALMAP

  uniform bool emissiveMapEnabled;
  uniform vec3 emissiveFactor; // #ifdef HAS_EMISSIVEMAP

  uniform vec2 metallicRoughnessValues;
  uniform bool metallicRoughnessMapEnabled;

  uniform bool occlusionMapEnabled;
  uniform float occlusionStrength; // #ifdef HAS_OCCLUSIONMAP
  
  uniform bool alphaCutoffEnabled;
  uniform float alphaCutoff; // #ifdef ALPHA_CUTOFF
  
  // IBL
  uniform bool IBLenabled;
  uniform vec2 scaleIBLAmbient; // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  uniform vec4 scaleDiffBaseMR;
  uniform vec4 scaleFGDSpec;
  // #endif
};

// Samplers
#ifdef HAS_BASECOLORMAP
uniform sampler2D u_BaseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D u_NormalSampler;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D u_EmissiveSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D u_MetallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D u_OcclusionSampler;
#endif
#ifdef USE_IBL
uniform samplerCube u_DiffuseEnvSampler;
uniform samplerCube u_SpecularEnvSampler;
uniform sampler2D u_brdfLUT;
#endif

`;
