// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderPass} from '@luma.gl/shadertools';

/**
 * Gets fragment shader source for a shader pass sub pass
 * @param options
 * @returns
 */
export function getFragmentShaderForRenderPass(options: {
  shaderPass: ShaderPass;
  action: 'filter' | 'sample';
  shadingLanguage: 'wgsl' | 'glsl';
}): string {
  const {shaderPass, action, shadingLanguage} = options;
  switch (action) {
    case 'filter':
      let func = `${shaderPass.name}_filterColor`;
      return shadingLanguage === 'wgsl' ? getFilterShaderWGSL(func) : getFilterShaderGLSL(func);

    case 'sample':
      func = `${shaderPass.name}_sampleColor`;
      return shadingLanguage === 'wgsl' ? getSamplerShaderWGSL(func) : getSamplerShaderGLSL(func);

    default:
      throw new Error(`${shaderPass.name} no fragment shader generated for shader pass`);
  }
}

/** Get a filtering WGSL fragment shader */
function getFilterShaderWGSL(func: string) {
  return /* wgsl */ `\
// Binding 0:1 is reserved for shader passes
@group(0) @binding(0) var<uniform> brightnessContrast : brightnessContrastUniforms;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var sampler: sampler;

struct FragmentInputs = {
  @location(0) fragUV: vec2f,
  @location(1) fragPosition: vec4f,
  @location(2) fragCoordinate: vec4f
};

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texSize = textureDimensions(texture, 0);
  var fragColor = textureSample(texture, sampler, fragUV);
  fragColor = ${func}(gl_FragColor, texSize, texCoord);
  return fragColor;
}
`;
}

/** Get a sampling WGSL fragment shader */
function getSamplerShaderWGSL(func: string) {
  return /* wgsl */ `\
// Binding 0:1 is reserved for shader passes
@group(0) @binding(0) var<uniform> brightnessContrast : brightnessContrastUniforms;
@group(0) @binding(1) var texture: texture_2d<f32>;
@group(0) @binding(2) var sampler: sampler;

struct FragmentInputs = {
  @location(0) fragUV: vec2f,
  @location(1) fragPosition: vec4f,
  @location(2) fragCoordinate: vec4f
};

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let texSize = textureDimensions(texture, 0);
  var fragColor = textureSample(texture, sampler, fragUV);
  fragColor = ${func}(gl_FragColor, texSize, texCoord);
  return fragColor;
}
`;
}

/** Get a filtering GLSL fragment shader */
function getFilterShaderGLSL(func: string) {
  return /* glsl */ `\
uniform sampler2D texture;
uniform vec2 texSize;

varying vec2 position;
varying vec2 coordinate;
varying vec2 uv;

void main() {
  vec2 texCoord = coordinate;
  vec2 texSize = textureSize(texture, 0);

  gl_FragColor = texture2D(texture, texCoord);
  gl_FragColor = ${func}(gl_FragColor, texSize, texCoord);
}
`;
}

/** Get a sampling GLSL fragment shader */
function getSamplerShaderGLSL(func: string) {
  return /* glsl */ `\  
uniform sampler2D texture;
// uniform vec2 texSize;

varying vec2 position;
varying vec2 coordinate;
varying vec2 uv;

void main() {
  vec2 texCoord = coordinate;
  vec2 texSize = textureSize(texture, 0);

  gl_FragColor = ${func}(texture, texSize, texCoord);
}
`;
}
