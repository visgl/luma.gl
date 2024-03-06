// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Note: This was the only dependency that made @luma.gl/webgl depend on @luma.gl/shadertools
// This file was coped from shadertools to avoid the dependency

/** Information extracted from shader source code */
export type ShaderInfo = {
  name: string;
  language: 'glsl' | 'wgsl';
  version: number;
};

/** Extracts information from shader source code */
export function getShaderInfo(source: string, defaultName?: string): ShaderInfo {
  return {
    name: getShaderName(source, defaultName),
    language: 'glsl',
    version: getShaderVersion(source)
  };
}

/** Extracts GLSLIFY style naming of shaders: `#define SHADER_NAME ...` */
function getShaderName(shader: string, defaultName: string = 'unnamed'): string {
  const SHADER_NAME_REGEXP = /#define[\s*]SHADER_NAME[\s*]([A-Za-z0-9_-]+)[\s*]/;
  const match = SHADER_NAME_REGEXP.exec(shader);
  return match ? match[1] : defaultName;
}

/** returns GLSL shader version of given shader string */
function getShaderVersion(source: string): number {
  let version = 100;
  const words = source.match(/[^\s]+/g);
  if (words && words.length >= 2 && words[0] === '#version') {
    const v = parseInt(words[1], 10);
    if (Number.isFinite(v)) {
      version = v;
    }
  }
  return version;
}
