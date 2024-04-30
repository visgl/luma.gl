// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const FS_GLES = /* glsl */ `\
out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`;
const FS300 = `#version 300 es\n${FS_GLES}`;

type QualifierInfo = {
  qualifier: string;
  type: string;
  name: string;
};

// Prase given glsl line and return qualifier details or null
export function getQualifierDetails(
  line: string,
  qualifiers: string | string[]
): QualifierInfo | null {
  qualifiers = Array.isArray(qualifiers) ? qualifiers : [qualifiers];
  const words = line.replace(/^\s+/, '').split(/\s+/);
  // TODO add support for precession qualifiers (highp, mediump and lowp)
  const [qualifier, type, definition] = words;
  if (!qualifiers.includes(qualifier) || !type || !definition) {
    return null;
  }
  const name = definition.split(';')[0];
  return {qualifier, type, name};
}

/**
 * Given the shader input and output variable names,
 * builds and return a pass through fragment shader.
 */
export function getPassthroughFS(options?: {
  input?: string;
  inputChannels?: 1 | 2 | 3 | 4;
  output?: string;
}): string {
  const {input, inputChannels, output} = options || {};
  if (!input) {
    // Default shader
    return FS300;
  }
  if (!inputChannels) {
    throw new Error('inputChannels');
  }
  const inputType = channelCountToType(inputChannels);
  const outputValue = convertToVec4(input, inputChannels);
  return `\
#version 300 es
in ${inputType} ${input};
out vec4 ${output};
void main() {
  ${output} = ${outputValue};
}`;
}

/** convert glsl type to suffix */
export function typeToChannelSuffix(type: string): 'x' | 'xy' | 'xyz' | 'xyzw' {
  // prettier-ignore
  switch (type) {
    case 'float': return 'x';
    case 'vec2': return 'xy';
    case 'vec3': return 'xyz';
    case 'vec4': return 'xyzw';
    default:
      throw new Error(type);
  }
}

/** convert glsl type to channel count */
export function typeToChannelCount(type: string): 1 | 2 | 3 | 4 {
  // prettier-ignore
  switch (type) {
    case 'float': return 1;
    case 'vec2': return 2;
    case 'vec3': return 3;
    case 'vec4': return 4;
    default:
      throw new Error(type);
  }
}
function channelCountToType(channels: 1 | 2 | 3 | 4): 'float' | 'vec2' | 'vec3' | 'vec4' {
  // prettier-ignore
  switch (channels) {
    case 1: return 'float';
    case 2: return 'vec2';
    case 3: return 'vec3';
    case 4: return 'vec4';
    default:
      throw new Error(`invalid channels: ${channels}`);
  }
}

/** Returns glsl instruction for converting to vec4 */
export function convertToVec4(variable: string, channels: 1 | 2 | 3 | 4): string {
  // prettier-ignore
  switch (channels) {
    case 1: return `vec4(${variable}, 0.0, 0.0, 1.0)`;
    case 2: return `vec4(${variable}, 0.0, 1.0)`;
    case 3: return `vec4(${variable}, 1.0)`;
    case 4: return variable;
    default:
      throw new Error(`invalid channels: ${channels}`);
  }
}
