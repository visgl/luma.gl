// Transpiles shader source code to target GLSL version
export default function transpileShader(source, targetGLSLVersion, isVertex) {
  switch (targetGLSLVersion) {
  case 300:
    return isVertex ?
      convertVertexShaderTo300(source, targetGLSLVersion) :
      convertFragmentShaderTo300(source, targetGLSLVersion);
  case 100:
    return isVertex ?
      convertVertexShaderTo100(source, targetGLSLVersion) :
      convertFragmentShaderTo100(source, targetGLSLVersion);
  default:
    throw new Error('unknown GLSL version');
  }
}

function convertVertexShaderTo300(source) {
  return source
    .replace(/$attribute\w+/g, 'in ')
    .replace(/$varying\w+/g, 'out ')
    .replace(/$texture2D\w+/g, 'texture')
    .replace(/$textureCube\w+/g, 'texture');

    // Deal with fragColor
    // .replace(/gl_fragColor/g, 'fragColor ');
}

function convertFragmentShaderTo300(source) {
  return source
    .replace(/$in\w+/g, 'varying ')
    .replace(/$texture2D\(/g, 'texture(')
    .replace(/$textureCube\(/g, 'texture(');

    // Deal with fragColor
    // .replace(/gl_fragColor/g, 'fragColor ');
}

function convertVertexShaderTo100(source) {
  return source
    .replace(/$in\w+/g, 'attribute ')
    .replace(/$out\w+/g, 'varying ')
    .replace(/$texture\w+/g, 'texture2D');
}

function convertFragmentShaderTo100(source) {
  return source
    .replace(/$in\w+/g, 'varying ')
    .replace(/$texture\w+/g, 'texture2D');

    // Deal with fragColor
    // .replace(/$out\w+/g, 'varying ')
}
