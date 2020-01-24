// Transpiles shader source code to target GLSL version
// Note: We always run transpiler even if same version e.g. 3.00 => 3.00
// RFC: https://github.com/uber/luma.gl/blob/7.0-release/dev-docs/RFCs/v6.0/portable-glsl-300-rfc.md
export default function transpileShader(source, targetGLSLVersion, isVertex) {
  switch (targetGLSLVersion) {
    case 300:
      return isVertex ? convertVertexShaderTo300(source) : convertFragmentShaderTo300(source);
    case 100:
      return isVertex ? convertVertexShaderTo100(source) : convertFragmentShaderTo100(source);
    default:
      throw new Error(`unknown GLSL version ${targetGLSLVersion}`);
  }
}

const FS_OUTPUT_REGEX = /^[ \t]*out\s+vec4\s+(\w+)\s*;/m;

function convertVertexShaderTo300(source) {
  return source
    .replace(/^(#version\s+(100|300\s+es))?[ \t]*\n/, '#version 300 es\n')
    .replace(/\battribute\s+/g, 'in ')
    .replace(/\bvarying\s+/g, 'out ')
    .replace(/\btexture2D\(/g, 'texture(')
    .replace(/\btextureCube\(+/g, 'texture(')
    .replace(/\btexture2DLodEXT\(/g, 'textureLod(')
    .replace(/\btextureCubeLodEXT\(/g, 'textureLod(');
}

function convertFragmentShaderTo300(source) {
  return source
    .replace(/^(#version\s+(100|300\s+es))?[ \t]*\n/, '#version 300 es\n')
    .replace(/\bvarying\s+/g, 'in ')
    .replace(/\btexture2D\(/g, 'texture(')
    .replace(/\btextureCube\(/g, 'texture(')
    .replace(/\btexture2DLodEXT\(/g, 'textureLod(')
    .replace(/\btextureCubeLodEXT\(/g, 'textureLod(');
}

function convertVertexShaderTo100(source) {
  // /gm - treats each line as a string, so that ^ matches after newlines
  return source
    .replace(/^#version\s+300\s+es/, '#version 100')
    .replace(/^[ \t]*in[ \t]+/gm, 'attribute ')
    .replace(/^[ \t]*out[ \t]+/gm, 'varying ')
    .replace(/\btexture\(/g, 'texture2D(')
    .replace(/\btextureLod\(/g, 'texture2DLodEXT(');
}
/* eslint-disable */
function convertFragmentShaderTo100(source) {
  // /gm - treats each line as a string, so that ^ matches after newlines
  source = source
    .replace(/^#version\s+300\s+es/, '#version 100')
    .replace(/^[ \t]*in[ \t]+/gm, 'varying ')
    .replace(/\btexture\(/g, 'texture2D(')
    .replace(/\btextureLod\(/g, 'texture2DLodEXT(');

  const outputMatch = source.match(FS_OUTPUT_REGEX);
  if (outputMatch) {
    const outputName = outputMatch[1];
    source = source
      .replace(FS_OUTPUT_REGEX, '')
      .replace(new RegExp(`\\b${outputName}\\b`, 'g'), 'gl_FragColor');
  }

  return source;
}
