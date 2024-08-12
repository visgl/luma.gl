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
      const filterFunc = `${shaderPass.name}_filterColor_ext`;
      return shadingLanguage === 'wgsl'
        ? getFilterShaderWGSL(filterFunc)
        : getFilterShaderGLSL(filterFunc);

    case 'sample':
      const samplerFunc = `${shaderPass.name}_sampleColor`;
      return shadingLanguage === 'wgsl'
        ? getSamplerShaderWGSL(samplerFunc)
        : getSamplerShaderGLSL(samplerFunc);

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
#version 300 es

uniform sampler2D sourceTexture;

in vec2 position;
in vec2 coordinate;
in vec2 uv;

out vec4 fragColor;

void main() {
  vec2 texCoord = coordinate;
  ivec2 iTexSize = textureSize(sourceTexture, 0);
  vec2 texSize = vec2(float(iTexSize.x), float(iTexSize.y));

  fragColor = texture(sourceTexture, texCoord);
  fragColor = ${func}(fragColor, texSize, texCoord);
}
`;
}

/** Get a sampling GLSL fragment shader */
function getSamplerShaderGLSL(func: string) {
  return /* glsl */ `\
#version 300 es

uniform sampler2D sourceTexture;

in vec2 position;
in vec2 coordinate;
in vec2 uv;

out vec4 fragColor;

void main() {
  vec2 texCoord = coordinate;
  ivec2 iTexSize = textureSize(sourceTexture, 0);
  vec2 texSize = vec2(float(iTexSize.x), float(iTexSize.y));

  fragColor = ${func}(sourceTexture, texSize, texCoord);
}
`;
}
