// Transpiles shader source code to target GLSL version
// Note: We always run transpiler even if same version e.g. 3.00 => 3.00
// RFC: https://github.com/visgl/luma.gl/blob/7.0-release/dev-docs/RFCs/v6.0/portable-glsl-300-rfc.md
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

const FS_OUTPUT_REGEX = /^[ \t]*out[ \t]+vec4[ \t]+(\w+)[ \t]*;\s+/m;

function convertVertexShaderTo300(source) {
  return source
    .replace(/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/, '#version 300 es\n')
    .replace(/^[ \t]*attribute[ \t]+(.+;)/gm, 'in $1')
    .replace(/^[ \t]*varying[ \t]+(.+;)/gm, 'out $1')
    .replace(/\btexture2D\(/g, 'texture(')
    .replace(/\btextureCube\(+/g, 'texture(')
    .replace(/\btexture2DLodEXT\(/g, 'textureLod(')
    .replace(/\btextureCubeLodEXT\(/g, 'textureLod(');
}

function convertFragmentShaderTo300(source) {
  return source
    .replace(/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/, '#version 300 es\n')
    .replace(/^[ \t]*varying[ \t]+(.+;)/gm, 'in $1')
    .replace(/\btexture2D\(/g, 'texture(')
    .replace(/\btextureCube\(/g, 'texture(')
    .replace(/\btexture2DLodEXT\(/g, 'textureLod(')
    .replace(/\btextureCubeLodEXT\(/g, 'textureLod(');
}

function convertVertexShaderTo100(source) {
  // /gm - treats each line as a string, so that ^ matches after newlines
  return source
    .replace(/^#version[ \t]+300[ \t]+es/, '#version 100')
    .replace(/^[ \t]*in[ \t]+(.+;)/gm, 'attribute $1')
    .replace(/^[ \t]*out[ \t]+(.+;)/gm, 'varying $1')
    .replace(/\btexture\(/g, 'texture2D(')
    .replace(/\btextureLod\(/g, 'texture2DLodEXT(');
}

function convertFragmentShaderTo100(source) {
  // /gm - treats each line as a string, so that ^ matches after newlines
  source = source
    .replace(/^#version[ \t]+300[ \t]+es/, '#version 100')
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
