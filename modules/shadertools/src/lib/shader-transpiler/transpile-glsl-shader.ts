// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// TRANSPILATION TABLES

/**
 * Transpiles GLSL 3.00 shader source code to target GLSL version (3.00 or 1.00)
 *
 * @note We always run transpiler even if same version e.g. 3.00 => 3.00
 * @note For texture sampling transpilation, apps need to use non-standard texture* calls in GLSL 3.00 source
 * RFC: https://github.com/visgl/luma.gl/blob/7.0-release/dev-docs/RFCs/v6.0/portable-glsl-300-rfc.md
 */
export function transpileGLSLShader(
  source: string,
  targetGLSLVersion: 100 | 300,
  stage: 'vertex' | 'fragment'
): string {
  const sourceGLSLVersion = Number(source.match(/^#version[ \t]+(\d+)/m)?.[1] || 100);
  if (sourceGLSLVersion !== 300) {
    throw new Error('luma.gl v9 only supports GLSL 3.00 shader sources');
  }

  switch (targetGLSLVersion) {
    case 300:
      switch (stage) {
        case 'vertex':
          source = convertShader(source, ES300_VERTEX_REPLACEMENTS);
          return source;
        case 'fragment':
          source = convertShader(source, ES300_FRAGMENT_REPLACEMENTS);
          // source = convertFragmentShaderTo300(source);
          return source;
        default:
          // Unknown shader stage
          throw new Error(stage);
      }
      
    case 100:
      switch (stage) {
        case 'vertex':
          source = convertShader(source, ES100_VERTEX_REPLACEMENTS);
          return source;
        case 'fragment':
          source = convertShader(source, ES100_FRAGMENT_REPLACEMENTS);
          source = convertFragmentShaderTo100(source);
          return source;
        default:
          // Unknown shader stage
          throw new Error(stage);
      }

    default:
      // Unknown GLSL version
      throw new Error(String(targetGLSLVersion));
  }
}

type GLSLReplacement = [RegExp, string];

/** Simple regex replacements for GLSL ES 1.00 syntax that has changed in GLSL ES 3.00 */
const ES300_REPLACEMENTS: GLSLReplacement[] = [
  // Fix poorly formatted version directive
  [/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/, '#version 300 es\n'],
  // The individual `texture...()` functions were replaced with `texture()` overloads
  [/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g, 'textureLod('],
  [/\btexture(2D|2DProj|Cube)(EXT)?\(/g, 'texture(']
];

const ES300_VERTEX_REPLACEMENTS: GLSLReplacement[] = [
  ...ES300_REPLACEMENTS,
  // `attribute` keyword replaced with `in`
  [makeVariableTextRegExp('attribute'), 'in $1'],
  // `varying` keyword replaced with `out`
  [makeVariableTextRegExp('varying'), 'out $1']
];

/** Simple regex replacements for GLSL ES 1.00 syntax that has changed in GLSL ES 3.00 */
const ES300_FRAGMENT_REPLACEMENTS: GLSLReplacement[] = [
  ...ES300_REPLACEMENTS,
  // `varying` keyword replaced with `in`
  [makeVariableTextRegExp('varying'), 'in $1']
];

const ES100_REPLACEMENTS: GLSLReplacement[] = [
  [/^#version[ \t]+300[ \t]+es/, '#version 100'],

  // In GLSL 1.00 ES these functions are provided by an extension
  [/\btexture(2D|2DProj|Cube)Lod\(/g, 'texture$1LodEXT('],

  // Overloads in GLSL 3.00 map to individual functions. Note that we cannot
  // differentiate 2D,2DProj,Cube without type analysis so we choose the most common variant.
  [/\btexture\(/g, 'texture2D('],
  [/\btextureLod\(/g, 'texture2DLodEXT(']
];

const ES100_VERTEX_REPLACEMENTS: GLSLReplacement[] = [
  ...ES100_REPLACEMENTS,
  [makeVariableTextRegExp('in'), 'attribute $1'],
  [makeVariableTextRegExp('out'), 'varying $1']
];

const ES100_FRAGMENT_REPLACEMENTS: GLSLReplacement[] = [
  ...ES100_REPLACEMENTS,
  // Replace `in` with `varying`
  [makeVariableTextRegExp('in'), 'varying $1']
];

const ES100_FRAGMENT_OUTPUT_NAME: string = 'gl_FragColor';
const ES300_FRAGMENT_OUTPUT_REGEX: RegExp = /\bout[ \t]+vec4[ \t]+(\w+)[ \t]*;\n?/;
// const REGEX_START_OF_MAIN: RegExp = /void\s+main\s*\([^)]*\)\s*\{\n?/; // Beginning of main

function convertShader(source: string, replacements: GLSLReplacement[]) {
  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement);
  }
  return source;
}

/** Transform fragment shader source code to GLSL 3.00 */
// function convertFragmentShaderTo300(source: string): string {
//   const outputMatch = ES300_FRAGMENT_OUTPUT_REGEX.exec(source);
//   if (outputMatch) {
//     const outputName = outputMatch[1];
//     source = source.replace(new RegExp(`\\b${ES100_FRAGMENT_OUTPUT_NAME}\\b`, 'g'), outputName);
//   } else {
//     const outputName = 'fragmentColor';
//     source = source
//       .replace(REGEX_START_OF_MAIN, match => `out vec4 ${outputName};\n${match}`)
//       .replace(new RegExp(`\\b${ES100_FRAGMENT_OUTPUT_NAME}\\b`, 'g'), outputName);
//   }

//   return source;
// }

/** Transform fragment shader source code to GLSL ES 100 */
function convertFragmentShaderTo100(source: string): string {
  source = convertShader(source, ES100_FRAGMENT_REPLACEMENTS);

  // TODO - This seems like a hack to find the color output name,
  // what if we have several outputs?
  const outputMatch = ES300_FRAGMENT_OUTPUT_REGEX.exec(source);
  if (outputMatch) {
    const outputName = outputMatch[1];
    source = source
      // Remove the GLSL300 output declaration
      .replace(ES300_FRAGMENT_OUTPUT_REGEX, '')
      // Replace any found output name 
      .replace(new RegExp(`\\b${outputName}\\b`, 'g'), ES100_FRAGMENT_OUTPUT_NAME);
  }

  return source;
}

/**
 * Creates a regexp that tests for a specific variable type
 * @example
 *   should match:
 *     in float weight;
 *     out vec4 positions[2];
 *   should not match:
 *     void f(out float a, in float b) {}
 */
function makeVariableTextRegExp(qualifier: 'attribute' | 'varying' | 'in' | 'out'): RegExp {
  return new RegExp(`\\b${qualifier}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`, 'g');
}
